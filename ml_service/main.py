from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from PIL import Image
import pytesseract
import io
import requests
import torch
from transformers import CLIPProcessor, CLIPModel, BlipProcessor, BlipForConditionalGeneration

app = FastAPI()
def fetch_tag_vocabulary():
    try:
        resp = requests.get("http://backend:3000/api/tags/vocabulary", timeout=5)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        print("[Tag Vocabulary Fetch Error]", e)
        return []

# Load CLIP model and processor once at startup
clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

# Load BLIP model and processor once at startup
blip_processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-large")
blip_model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-large")
# blip_processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
# blip_model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base")

# Goal	Approach
# Better captions	Switch to blip-large or GitHub: BLIP-2, or IDEFICS
# Multi-sentence summaries	Use LLM (e.g. prompt GPT-4 with tags + OCR + BLIP caption)
# Fine-tuned lost & found NLP	Train a BLIP head or use a small LoRA model on annotated items
# Attribute extraction	Run object detectors (e.g. YOLOv8) and combine with CLIP or captions

@app.get("/tags")
def get_tags():
    return ['wallet', 'passport', 'phone', 'backpack', 'laptop']  # To be fetched from the DB in a later step

@app.post("/ocr")
async def perform_ocr(file: UploadFile = File(...)):
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")

    # OCR step
    text = pytesseract.image_to_string(image).strip()

    # ⏬ Get up-to-date tag labels from DB
    candidate_labels = fetch_tag_vocabulary()

    # 📌 If empty, avoid crash
    if not candidate_labels:
        candidate_labels = ["item", "object", "thing"]

    # CLIP tag processing
    inputs = clip_processor(text=candidate_labels, images=image, return_tensors="pt", padding=True)
    outputs = clip_model(**inputs)

    # Get predictions
    logits_per_image = outputs.logits_per_image  # shape: [1, N_labels]
    probs = logits_per_image.softmax(dim=1)

    # ✅ Filter by confidence
    threshold = 0.25  # or 0.30 to be stricter
    top_probs, top_indices = torch.topk(probs, k=5)
    tags = []
    tag_scores = []

    for i, score in enumerate(top_probs[0]):
        if score >= threshold:
            idx = top_indices[0][i].item()
            tags.append(candidate_labels[idx])
            tag_scores.append(float(score))

    # Caption generation (free-form)
    # BLIP captioning
    blip_inputs = blip_processor(images=image, return_tensors="pt")
    blip_output = blip_model.generate(**blip_inputs, max_length=50)
    caption = blip_processor.decode(blip_output[0], skip_special_tokens=True)
    caption_confidence = 1.0  # dummy placeholder


    # Embedding vector
    image_embedding = outputs.image_embeds[0].tolist()

    return JSONResponse(content={
        "description": caption,
        "description_score": caption_confidence,
        "text": text,
        "tags": tags,
        "tag_scores": tag_scores,
        "embedding": image_embedding
    })

