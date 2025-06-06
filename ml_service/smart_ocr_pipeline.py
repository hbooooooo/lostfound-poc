
import easyocr
import numpy as np
from PIL import Image, ImageOps

def enhance_for_small_text(img):
    gray = img.convert("L")
    gray = gray.resize((gray.width * 2, gray.height * 2))
    return ImageOps.autocontrast(gray)

def smart_ocr_pipeline(image: Image.Image) -> str:
    reader = easyocr.Reader(['en'], gpu=True)

    original = np.array(image)
    enhanced = np.array(enhance_for_small_text(image))

    print("🔍 Running EasyOCR with allowlist and rotation")

    results = reader.readtext(
        original,
        allowlist='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ',
        rotation_info=[0, 90, 180, 270],
        detail=1,
        paragraph=False
    ) + reader.readtext(
        enhanced,
        allowlist='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ',
        rotation_info=[0, 90, 180, 270],
        detail=1,
        paragraph=False
    )

    if not results:
        print("🚫 No text detected at all")
        return ""

    print("=== RAW OCR RESULTS ===")
    for r in results:
        print(f"Text: '{r[1]}' | Conf: {r[2]:.2f}")

    # Light filtering
    filtered = [r for r in results if len(r[1].strip()) >= 3 and r[2] >= 0.2]
    if not filtered:
        print("🚫 All candidates filtered out")
        return ""

    # Deduplicate
    seen = set()
    deduped = []
    for r in filtered:
        if r[1] not in seen:
            deduped.append(r)
            seen.add(r[1])

    final_text = " ".join([r[1] for r in deduped])
    print("✅ Final text:", final_text)
    return final_text
