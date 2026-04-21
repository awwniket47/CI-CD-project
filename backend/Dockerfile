# backend/Dockerfile
FROM python:3.11-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
 && pip install --no-cache-dir -r requirements.txt

# ── Production image ──────────────────────────────────────────────────────────
FROM python:3.11-slim AS production

# Create non-root user with a real home directory
# (python:3.11-slim uses busybox adduser which lacks --create-home)
RUN addgroup --system appgroup \
 && adduser --system --ingroup appgroup --home /home/appuser --no-create-home appuser \
 && mkdir -p /home/appuser \
 && chown appuser:appgroup /home/appuser

WORKDIR /app

# Copy installed Python packages from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages \
                    /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy all app source with correct ownership.
# The .dockerignore (copied to backend/ by CI) controls what's excluded.
COPY --chown=appuser:appgroup . .

# Ensure the knowledge_base Python package is present
# (guards against any .dockerignore misconfiguration)
RUN test -f /app/knowledge_base/__init__.py \
    && test -f /app/knowledge_base/repository.py \
    && echo "✅ knowledge_base package present" \
    || (echo "❌ knowledge_base package MISSING — check .dockerignore" && exit 1)

# Create runtime data directories (will be overlaid by Docker volumes)
RUN mkdir -p /app/knowledge_base /app/chroma_db \
 && chown -R appuser:appgroup /app/knowledge_base /app/chroma_db

USER appuser

EXPOSE 8000

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    HOME=/home/appuser \
    CHROMA_CACHE_DIR=/app/chroma_db/.cache

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/health')" \
  || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]