from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from PIL import Image
import pytesseract
import io
import torch
from transformers import CLIPProcessor, CLIPModel

app = FastAPI()

# Load CLIP model and processor once at startup
clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

# Define some labels to classify against
candidate_labels = [
    "bag", "wallet", "passport", "sunglasses", "jewelry", "phone", "laptop", "watch", "headphones", "documents"
]

candidate_captions = [
    "a black leather wallet on a table",
    "a blue backpack near a bench",
    "a passport and boarding pass",
    "a smartphone with a cracked screen",
    "a pair of sunglasses",
    "a silver wristwatch",
    "a laptop with stickers",
    "a lost book",
    "a document folder",
    "a pair of wireless earbuds"
]


@app.post("/ocr")
async def perform_ocr(file: UploadFile = File(...)):
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")

    # OCR step
    text = pytesseract.image_to_string(image).strip()

    # CLIP processing
    inputs = clip_processor(text=candidate_labels, images=image, return_tensors="pt", padding=True)
    outputs = clip_model(**inputs)

    logits_per_image = outputs.logits_per_image  # shape: [1, N_labels]
    probs = logits_per_image.softmax(dim=1)

    # Get top 3 predictions
    top_probs, top_indices = torch.topk(probs, k=3)
    tags = [candidate_labels[i] for i in top_indices[0]]
    tag_scores = [float(p) for p in top_probs[0]]

    # Caption generation via zero-shot similarity
    caption_inputs = clip_processor(text=candidate_captions, images=image, return_tensors="pt", padding=True)
    caption_outputs = clip_model(**caption_inputs)

    caption_logits = caption_outputs.logits_per_image
    caption_probs = caption_logits.softmax(dim=1)

    top_caption_idx = torch.argmax(caption_probs, dim=1).item()
    caption = candidate_captions[top_caption_idx]
    caption_confidence = float(caption_probs[0, top_caption_idx])

    # Embedding vector (can be used later for similarity search)
    image_embedding = outputs.image_embeds[0].tolist()  # convert to list for JSON serialization

    return JSONResponse(content={
        "description": caption,
        "description_score": caption_confidence,
        "text": text,
        "tags": tags,
        "tag_scores": tag_scores,
        "embedding": image_embedding
    })
