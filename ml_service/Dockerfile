FROM pytorch/pytorch:2.1.0-cuda12.1-cudnn8-runtime

WORKDIR /app

# Set non-interactive mode to avoid prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies without trying to install CUDA/cuDNN again
RUN apt-get update && \
    apt-get install -y \
        libgl1-mesa-glx \
        libglib2.0-0 \
        libsm6 \
        libxext6 \
        libxrender-dev \
        tesseract-ocr \
        git \
        curl && \
    rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .

RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Download models during the build
RUN python3 -c "\
from transformers import CLIPModel, CLIPProcessor, BlipProcessor, BlipForConditionalGeneration; \
CLIPModel.from_pretrained('openai/clip-vit-base-patch32'); \
CLIPProcessor.from_pretrained('openai/clip-vit-base-patch32'); \
BlipProcessor.from_pretrained('Salesforce/blip-image-captioning-large'); \
BlipForConditionalGeneration.from_pretrained('Salesforce/blip-image-captioning-large')"

COPY . .

EXPOSE 80

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "80"]

