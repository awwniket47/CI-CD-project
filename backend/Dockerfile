# backend/Dockerfile — optimised for smaller image + faster builds
FROM python:3.11-slim AS builder

WORKDIR /app

# Install build deps only in builder stage — not carried into production image
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# --no-cache-dir       : skip pip's HTTP cache (saves space in layer)
# --compile            : pre-compile .py → .pyc at install time (faster cold starts)
# --no-binary :all:    is intentionally NOT set — pre-built wheels are much faster
RUN pip install --no-cache-dir --upgrade pip \
 && pip install --no-cache-dir --compile -r requirements.txt

# ── Production image — start clean, copy only installed packages
FROM python:3.11-slim AS production

# Non-root user
RUN addgroup --system appgroup \
 && adduser --system --ingroup appgroup appuser

WORKDIR /app

# Copy installed packages from builder (no compiler tools in final image)
COPY --from=builder /usr/local/lib/python3.11/site-packages \
                    /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

COPY --chown=appuser:appgroup . .

USER appuser
EXPOSE 8000

ENV PYTHONUNBUFFERED=1 \
    # Prevent Python from writing .pyc files at runtime (already compiled)
    PYTHONDONTWRITEBYTECODE=1 \
    # Tell ChromaDB/onnxruntime where to cache the embedding model
    # so it survives container restarts when /app/chroma_db is volume-mounted
    CHROMA_CACHE_DIR=/app/chroma_db/.cache

HEALTHCHECK --interval=30s --timeout=10s --start-period=25s --retries=3 \
  CMD python -c "import httpx; httpx.get('http://localhost:8000/api/health').raise_for_status()" \
  || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]