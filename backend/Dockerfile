# backend/Dockerfile
FROM python:3.11-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
 && pip install --no-cache-dir -r requirements.txt

# ── Production image
FROM python:3.11-slim AS production

# Create group + user + home dir manually
# (python:3.11-slim busybox adduser has no --create-home flag)
RUN addgroup --system appgroup \
 && adduser --system --ingroup appgroup --home /home/appuser --no-create-home appuser \
 && mkdir -p /home/appuser \
 && chown appuser:appgroup /home/appuser

WORKDIR /app

# Copy installed packages — owned by root is fine, they only need to be readable
COPY --from=builder /usr/local/lib/python3.11/site-packages \
                    /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy app source — set ownership here, no second chown pass needed
COPY --chown=appuser:appgroup . .

USER appuser

EXPOSE 8000

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    HOME=/home/appuser \
    CHROMA_CACHE_DIR=/app/chroma_db/.cache

HEALTHCHECK --interval=30s --timeout=10s --start-period=25s --retries=3 \
  CMD python -c "import httpx; httpx.get('http://localhost:8000/api/health').raise_for_status()" \
  || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]