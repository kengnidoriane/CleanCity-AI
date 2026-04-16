# Python 3.12 slim — smaller image, compatible with ortools wheels
FROM python:3.12-slim

WORKDIR /app

# System deps needed by ortools
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.docker.txt ./
RUN pip install --no-cache-dir -r requirements.docker.txt

# Copy application source
COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
