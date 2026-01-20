# Base image
FROM python:3.12-slim

# System dependencies for librosa, torchaudio, and OpenCV
RUN apt-get update && apt-get install -y \
    build-essential \
    ffmpeg \
    libsndfile1 \
    libsm6 \
    libxrender1 \
    libxext6 \
    git \
 && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /python

# Copy Python requirements
COPY requirements.txt .

# Install Python packages
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copy your analyzer script
COPY . .

# Expose port if needed (optional, for Flask API)
EXPOSE 5000

# Default command (you can override in Docker Compose)
CMD ["python", "app.py"]