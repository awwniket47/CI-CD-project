# RetailMind — Autonomous Retail Research Agent CI/CD Pipeline
Docker Compose pulls the new image while the old container is still
running. The `up -d` command replaces containers one service at a time,
and the backend health check at `/api/health` confirms the new container
is live before the old one is removed. The frontend nginx container
serves cached static files during the transition.

---

## GitHub Secrets Required

Before the pipeline can run, these five secrets must be configured:

| Secret | Description |
|---|---|
| `DOCKERHUB_USERNAME` | Docker Hub account username |
| `DOCKERHUB_TOKEN` | Docker Hub access token (not password) |
| `EC2_HOST` | Public IP address of your EC2 instance |
| `EC2_USERNAME` | SSH username (typically `ubuntu`) |
| `EC2_SSH_KEY` | Full PEM private key content for SSH access |

---

## Environment Variables

The backend requires these variables in `backend/.env` on the server:

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Yes | Google Gemini API key for LLM |
| `TAVILY_API_KEY` | Yes | Tavily Search API key for web search |
| `KB_DIR` | No | Knowledge base directory (default: `./knowledge_base`) |
| `CHROMA_DIR` | No | ChromaDB directory (default: `./chroma_db`) |

---

## Running Locally

```bash
# Copy and fill in your API keys
cp backend/.env.example backend/.env

# Start the full stack
docker compose up --build

# Access the app
# Frontend  → http://localhost
# API docs  → http://localhost:8000/docs
# Health    → http://localhost:8000/api/health
```

---

## Group Members

| Name | Enrollment Number |
|---|---|
| Anurag Didolkar | EN22CS301169 |
| Anuj Singh Rathore | EN22CS301166 |
| Aniket Kushwah | EN22CS301124 |
| Arsh Patidar | EN22CS301204 |
| Amit Patidar | EN22CS301114 |
| Avani Gupta | EN22CS301236 |

---

- **Institution** — Medicaps University, Datagami Skill Based Course
- **Academic Year** — 2025–2026
- **Industry Mentor** — Prof. Akshay Saxena
