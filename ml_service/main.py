import os
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from PIL import Image
from paddleocr import PaddleOCR  # Add this import at the beginning of the file
from paddle_ocr import paddle_ocr
import pytesseract
import io
import requests
import torch
from transformers import (
    CLIPProcessor, CLIPModel,
    BlipProcessor, BlipForConditionalGeneration
)
import cv2
import numpy as np

# Point d'accès FastAPI
app = FastAPI()

# 🔁 Load models from local cache (set via environment)
HF_CACHE = os.getenv("TRANSFORMERS_CACHE", "/root/.cache/huggingface")
PADDLE_CACHE = os.getenv("PADDLE_MODEL_PATH", "/root/.cache/paddleocr")

print("Loading CLIP model...")
clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32", cache_dir=HF_CACHE)
clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32", cache_dir=HF_CACHE)

print("Loading BLIP model...")
blip_processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-large", cache_dir=HF_CACHE)
blip_model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-large", cache_dir=HF_CACHE)

print("✅ All models loaded successfully!")
clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32", cache_dir=HF_CACHE)
clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32", cache_dir=HF_CACHE)

blip_processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-large", cache_dir=HF_CACHE)
blip_model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-large", cache_dir=HF_CACHE)

ocr_model = PaddleOCR(use_angle_cls=True, lang='en', det_db_box_thresh=0.3, use_gpu=True, 
                      det_model_dir=os.path.join(PADDLE_CACHE, "en_PP-OCRv3_det_infer"),
                      rec_model_dir=os.path.join(PADDLE_CACHE, "en_PP-OCRv3_rec_infer"),
                      cls_model_dir=os.path.join(PADDLE_CACHE, "ch_ppocr_mobile_v2.0_cls_infer"))


def preprocess_image_for_ocr(image):
    """
    Preprocess image to improve OCR accuracy
    """
    # Convert PIL to OpenCV format
    cv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
    
    # Convert to grayscale
    gray = cv2.cvtColor(cv_image, cv2.COLOR_BGR2GRAY)
    
    # Apply different preprocessing techniques
    processed_images = []
    
    # 1. Original grayscale
    processed_images.append(("original", gray))
    
    # 2. Gaussian blur + threshold (good for clean text)
    blurred = cv2.GaussianBlur(gray, (3, 3), 0)
    thresh1 = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
    processed_images.append(("otsu", thresh1))
    
    # 3. Adaptive threshold (good for varying lighting)
    adaptive = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                   cv2.THRESH_BINARY, 11, 2)
    processed_images.append(("adaptive", adaptive))
    
    # 4. Morphological operations (clean up noise)
    kernel = np.ones((2, 2), np.uint8)
    morph = cv2.morphologyEx(thresh1, cv2.MORPH_CLOSE, kernel)
    processed_images.append(("morph", morph))
    
    return processed_images

def detect_text_regions(image):
    """
    Improved text detection using multiple methods
    Returns (has_text_probability, text_characteristics)
    """
    # Convert PIL to OpenCV
    cv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
    gray = cv2.cvtColor(cv_image, cv2.COLOR_BGR2GRAY)
    image_area = gray.shape[0] * gray.shape[1]
    
    # Method 1: Edge density analysis
    edges = cv2.Canny(gray, 50, 150, apertureSize=3)
    edge_density = np.sum(edges > 0) / image_area
    
    # Method 2: Text-like contour analysis  
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    text_like_contours = 0
    line_like_contours = 0
    
    for contour in contours:
        area = cv2.contourArea(contour)
        if area < 20:  # Lower threshold for smaller text
            continue
            
        x, y, w, h = cv2.boundingRect(contour)
        aspect_ratio = w / h if h > 0 else 0
        
        # Text characteristics: reasonable aspect ratio and size
        if 0.1 < aspect_ratio < 15 and area < image_area * 0.3:
            text_like_contours += 1
            
            # Check for line-like text (common in documents)
            if 2 < aspect_ratio < 12 and h > 5:
                line_like_contours += 1
    
    # Method 3: Horizontal/vertical line detection (text often forms lines)
    kernel_horizontal = cv2.getStructuringElement(cv2.MORPH_RECT, (25, 1))
    kernel_vertical = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 25))
    
    horizontal_lines = cv2.morphologyEx(edges, cv2.MORPH_OPEN, kernel_horizontal)
    vertical_lines = cv2.morphologyEx(edges, cv2.MORPH_OPEN, kernel_vertical)
    
    h_line_density = np.sum(horizontal_lines > 0) / image_area
    v_line_density = np.sum(vertical_lines > 0) / image_area
    
    # Method 4: Variance analysis (text areas have high variance)
    variance = cv2.Laplacian(gray, cv2.CV_64F).var()
    variance_score = min(variance / 1000.0, 1.0)  # Normalize
    
    # Combine all indicators
    contour_score = min(text_like_contours / 8.0, 1.0)
    line_score = min(line_like_contours / 5.0, 1.0)
    edge_score = min(edge_density * 100, 1.0)
    structure_score = min((h_line_density + v_line_density) * 200, 1.0)
    
    # Weighted combination favoring multiple positive indicators
    text_probability = (
        contour_score * 0.3 + 
        line_score * 0.25 + 
        edge_score * 0.2 + 
        variance_score * 0.15 +
        structure_score * 0.1
    )
    
    characteristics = {
        "text_like_contours": text_like_contours,
        "line_like_contours": line_like_contours,
        "total_contours": len(contours),
        "edge_density": edge_density,
        "variance": variance,
        "h_line_density": h_line_density,
        "v_line_density": v_line_density
    }
    
    return text_probability, characteristics

def get_adaptive_psm(text_probability, characteristics):
    """
    Choose PSM mode based on detected text characteristics
    """
    if text_probability < 0.1:
        # Very unlikely to have text - use most conservative mode
        return 8  # Single word
    elif text_probability < 0.3:
        # Some text possible - single column
        return 6  # Single uniform block
    elif characteristics.get("rectangular_ratio", 0) > 0.5:
        # Lots of rectangular shapes - likely document/structured text
        return 3  # Fully automatic page segmentation (no OSD)
    elif characteristics["text_like_contours"] > 5:
        # Multiple text regions
        return 11  # Sparse text
    else:
        # Default for moderate text probability
        return 6  # Single uniform block

def perform_intelligent_ocr(image):
    """
    Fast OCR with basic optimization (keeping under 3 seconds)
    """
    try:
        # Quick text detection
        text_probability, characteristics = detect_text_regions(image)
        
        # If very low probability of text, skip OCR entirely  
        if text_probability < 0.15:
            return "", 0.0, {"skipped": True, "reason": "No text detected", "text_probability": text_probability}
        
        # Get adaptive PSM based on detection
        psm = get_adaptive_psm(text_probability, characteristics)
        
        # Improved preprocessing with multiple methods
        cv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        gray = cv2.cvtColor(cv_image, cv2.COLOR_BGR2GRAY)
        
        # Try multiple preprocessing approaches
        results = []
        
        # Method 1: Original grayscale with denoising
        try:
            denoised = cv2.fastNlMeansDenoising(gray)
            pil_img1 = Image.fromarray(denoised)
            text1 = pytesseract.image_to_string(pil_img1, config=f"--oem 3 --psm {psm}").strip()
            data1 = pytesseract.image_to_data(pil_img1, config=f"--oem 3 --psm {psm}", output_type=pytesseract.Output.DICT)
            conf1 = [int(c) for c in data1['conf'] if int(c) > 0]
            avg_conf1 = sum(conf1) / len(conf1) if conf1 else 0
            results.append((text1, avg_conf1, "denoised"))
        except:
            pass
        
        # Method 2: OTSU threshold  
        try:
            thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
            pil_img2 = Image.fromarray(thresh)
            text2 = pytesseract.image_to_string(pil_img2, config=f"--oem 3 --psm {psm}").strip()
            data2 = pytesseract.image_to_data(pil_img2, config=f"--oem 3 --psm {psm}", output_type=pytesseract.Output.DICT)
            conf2 = [int(c) for c in data2['conf'] if int(c) > 0]
            avg_conf2 = sum(conf2) / len(conf2) if conf2 else 0
            results.append((text2, avg_conf2, "otsu"))
        except:
            pass
            
        # Method 3: Adaptive threshold (for varying lighting)
        if text_probability > 0.25:
            try:
                adaptive = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
                pil_img3 = Image.fromarray(adaptive)
                text3 = pytesseract.image_to_string(pil_img3, config=f"--oem 3 --psm {psm}").strip()
                data3 = pytesseract.image_to_data(pil_img3, config=f"--oem 3 --psm {psm}", output_type=pytesseract.Output.DICT)
                conf3 = [int(c) for c in data3['conf'] if int(c) > 0]
                avg_conf3 = sum(conf3) / len(conf3) if conf3 else 0
                results.append((text3, avg_conf3, "adaptive"))
            except:
                pass
        
        # Choose best result
        if not results:
            best_text, best_confidence, best_method = "", 0, "failed"
        else:
            # Sort by confidence and text length (prefer longer text if confidence similar)
            results.sort(key=lambda x: (x[1], len(x[0].strip())), reverse=True)
            best_text, best_confidence, best_method = results[0]
        
        # Improved quality filter
        if best_confidence < 40 or len(best_text.strip()) < 2:
            best_text = ""
        elif text_probability < 0.2 and best_confidence < 60:
            best_text = ""
        
        ocr_info = {
            "method": best_method,
            "psm": psm,
            "text_probability": text_probability,
            "confidence": best_confidence,
            "fast_mode": True
        }
        
        return best_text, best_confidence / 100.0, ocr_info
        
    except Exception as e:
        print(f"Fast OCR failed: {e}")
        # Fallback to simple OCR
        try:
            text = pytesseract.image_to_string(image, config="--oem 3 --psm 6").strip()
            return text, 0.5, {"method": "fallback", "error": str(e)}
        except:
            return "", 0.0, {"method": "failed", "error": str(e)}

def extract_item_description(full_caption, tags=None):
    """
    Extract concise item description from full BLIP caption
    Converts "there is a keychain with a key on a wooden table" 
    to "keychain with key"
    """
    import re
    
    if not full_caption:
        return ""
    
    caption = full_caption.lower().strip()
    
    # Remove common sentence starters and locations
    patterns_to_remove = [
        r'^(there is |there are |this is |this shows |the image shows |it is |it shows )',
        r'^(a picture of |an image of |a photo of |a close up of )',
        r'\s+(on a table|on the table|on a desk|on the desk|on a surface|on the ground|on the floor)',
        r'\s+(sitting on|lying on|placed on|resting on)',
        r'\s+(in a room|in the room|indoors|outdoors)',
        r'\s+(with a white background|on a white background|against a white background)',
        r'\s+(on a wooden table|on a wood table|on a counter)',
    ]
    
    cleaned = caption
    for pattern in patterns_to_remove:
        cleaned = re.sub(pattern, '', cleaned)
    
    # Remove articles at the beginning if they remain
    cleaned = re.sub(r'^(a |an |the )', '', cleaned.strip())
    
    # If we have tags, try to make description more consistent with detected tags
    if tags and len(tags) > 0:
        main_tag = tags[0].lower()
        # If the main tag is not in the description, try to incorporate it
        if main_tag not in cleaned and len(cleaned.split()) > 3:
            # If description is complex and doesn't contain main tag, prefer the tag
            if any(word in cleaned for word in ['with', 'and', 'that']):
                # Keep descriptive parts but ensure main item type is prominent
                words = cleaned.split()
                if main_tag not in ' '.join(words[:2]):
                    cleaned = f"{main_tag} {cleaned}"
    
    # Clean up extra spaces and return
    cleaned = re.sub(r'\s+', ' ', cleaned.strip())
    
    # Fallback if cleaning removed too much
    if len(cleaned) < 3:
        return caption.strip()
    
    return cleaned

def fetch_tag_vocabulary():
    try:
        resp = requests.get("http://backend:3000/api/tags/vocabulary", timeout=5)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        print("[Tag Vocabulary Fetch Error]", e)
        return []

# Load models at startup (as before)
print("Loading CLIP model...")
clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32", cache_dir=HF_CACHE)
clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32", cache_dir=HF_CACHE)

print("Loading BLIP model...")
blip_processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-large", cache_dir=HF_CACHE)
blip_model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-large", cache_dir=HF_CACHE)

# blip_model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base")

# Goal	Approach
# Better captions	Switch to blip-large or GitHub: BLIP-2, or IDEFICS
# Multi-sentence summaries	Use LLM (e.g. prompt GPT-4 with tags + OCR + BLIP caption)
# Fine-tuned lost & found NLP	Train a BLIP head or use a small LoRA model on annotated items
# Attribute extraction	Run object detectors (e.g. YOLOv8) and combine with CLIP or captions

@app.get("/health")
def health_check():
    """Health check endpoint to verify service is ready"""
    if clip_model is not None and clip_processor is not None and blip_model is not None:
        return {"status": "ready", "models_loaded": True}
    else:
        return {"status": "loading", "models_loaded": False}

@app.get("/tags")
def get_tags():
    return ['wallet', 'passport', 'phone', 'backpack', 'laptop']  # To be fetched from the DB in a later step

@app.post("/ocr")
async def perform_ocr(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")

        # Intelligent OCR step using smart OCR pipeline
        text = paddle_ocr(image)
        ocr_confidence = 0.8
        ocr_info = {"method": "smart_pipeline"}

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
        full_caption = blip_processor.decode(blip_output[0], skip_special_tokens=True)
        
        # Extract concise item description
        concise_description = extract_item_description(full_caption, tags)
        caption_confidence = 1.0  # dummy placeholder

        # Embedding vector
        image_embedding = outputs.image_embeds[0].tolist()

        return JSONResponse(content={
            "description": concise_description,
            "description_score": caption_confidence,
            "text": text,
            "tags": tags,
            "tag_scores": tag_scores,
            "embedding": image_embedding,
            "ocr_info": ocr_info,  # Include OCR diagnostic information
            "full_caption": full_caption  # Keep original for debugging if needed
        })
    
    except Exception as e:
        print(f"Error in OCR processing: {e}")
        return JSONResponse(
            status_code=500,
            content={
                "error": "OCR processing failed", 
                "details": str(e),
                "text": "",
                "tags": [],
                "description": "",
                "embedding": [],
                "ocr_info": {"error": str(e)}
            }
        )
