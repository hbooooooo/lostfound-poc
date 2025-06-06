
from paddleocr import PaddleOCR
from PIL import Image
import numpy as np

# Load once at module level
ocr_model = PaddleOCR(use_angle_cls=True, lang='en', use_gpu=False)

def paddle_ocr(image: Image.Image) -> str:
    img_array = np.array(image.convert("RGB"))

    result = ocr_model.ocr(img_array, cls=True)

    if not result or not result[0]:
        print("🚫 No text found by PaddleOCR")
        return ""

    print("=== PaddleOCR Results ===")
    lines = []
    for line in result[0]:
        box, (text, conf) = line
        print(f"Text: {text} | Conf: {conf:.2f}")
        if len(text.strip()) >= 3 and conf >= 0.4:
            lines.append(text)

    final = " ".join(lines)
    print("✅ Final OCR:", final)
    return final
