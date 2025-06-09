FROM pytorch/pytorch:2.1.0-cuda12.1-cudnn8-runtime

WORKDIR /app

# Avoid interactive prompts during builds
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && \
    apt-get install -y \
        wget \
        libgl1-mesa-glx \
        libglib2.0-0 \
        libsm6 \
        libxext6 \
        libxrender-dev \
        git \
        curl \
        gnupg && \
    rm -rf /var/lib/apt/lists/*

# Copy Python requirements and install them
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Pre-download models (CLIP + BLIP) to avoid downloading at runtime
RUN python3 -c "\
from transformers import CLIPModel, CLIPProcessor, BlipProcessor, BlipForConditionalGeneration; \
CLIPModel.from_pretrained('openai/clip-vit-base-patch32'); \
CLIPProcessor.from_pretrained('openai/clip-vit-base-patch32'); \
BlipProcessor.from_pretrained('Salesforce/blip-image-captioning-large'); \
BlipForConditionalGeneration.from_pretrained('Salesforce/blip-image-captioning-large')"

# Make cuDNN and cuBLAS libraries available to Paddle
ENV LD_LIBRARY_PATH=/opt/conda/lib:/opt/conda/lib/python3.10/site-packages/torch/lib:$LD_LIBRARY_PATH

RUN ln -s /opt/conda/lib/python3.10/site-packages/torch/lib/libcudnn*.so* /usr/lib/ && \
    ln -sf /opt/conda/lib/python3.10/site-packages/torch/lib/libcudnn.so.8 /usr/lib/libcudnn.so && \
    ln -s /opt/conda/lib/libcublas.so.12 /usr/lib/libcublas.so.12 && \
    ln -sf /opt/conda/lib/libcublas.so.12.1.0.26 /usr/lib/libcublas.so

# Add the application code
COPY . .

EXPOSE 80

# Start the app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "80"]
