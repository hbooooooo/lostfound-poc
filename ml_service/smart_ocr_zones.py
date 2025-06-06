
import easyocr
import numpy as np
from PIL import Image
import cv2

def box_aspect_ratio(bbox):
    x0, y0 = bbox[0]
    x1, y1 = bbox[2]
    width = abs(x1 - x0)
    height = abs(y1 - y0)
    return width / max(height, 1)

def box_vertical_position(bbox):
    return (bbox[0][1] + bbox[2][1]) / 2

def smart_ocr_zones(image: Image.Image) -> str:
    reader = easyocr.Reader(['en'], gpu=True)
    img_array = np.array(image)

    results = reader.readtext(img_array, detail=1)

    print("=== ALL DETECTED BOXES ===")
    for box, text, conf in results:
        print(f"Text: {text} | Conf: {conf:.2f} | Aspect: {box_aspect_ratio(box):.2f} | PosY: {box_vertical_position(box):.1f}")

    # Filter boxes with good confidence and wide rectangular shape
    candidates = [
        (box, text, conf)
        for box, text, conf in results
        if conf >= 0.3 and box_aspect_ratio(box) > 2.5 and len(text.strip()) >= 3
    ]

    if not candidates:
        print("🚫 No valid OCR boxes after filtering")
        return ""

    # Sort by vertical position (optional tweak: bottom-up or top-down)
    candidates.sort(key=lambda x: box_vertical_position(x[0]))

    # Combine all text
    final_text = " ".join([text for _, text, _ in candidates])
    print("✅ Final merged text:", final_text)

    return final_text
