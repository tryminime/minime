FROM python:3.11-slim

WORKDIR /app

# Build arg to select requirements file (use requirements-ci.txt in CI)
ARG REQUIREMENTS_FILE=requirements.txt

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements*.txt ./
RUN pip install --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r ${REQUIREMENTS_FILE}

# Copy application code
COPY . .

# Create non-root user
RUN useradd -m -u 1000 minime && chown -R minime:minime /app
USER minime

EXPOSE 8000

# Default command (can be overridden in docker-compose)
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
