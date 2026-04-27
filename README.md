# RetailMind — Autonomous Retail Research Agent CI/CD Pipeline

A complete DevOps implementation for containerizing and deploying a
full-stack AI-powered Retail Research Application onto AWS EC2 using
Docker, GitHub Actions CI/CD, and a Python FastAPI backend with a
React frontend — with automated testing on every commit and
zero-downtime deployments on every merge to `main`.

---

## Project Overview

This project takes a full-stack **RetailMind** application — built with
FastAPI (Python) on the backend and React + Vite on the frontend — and
deploys it to a production-grade AWS EC2 instance. The deployment is
fully automated: a single `git push` triggers the entire test, build,
push, and deploy pipeline with no manual steps required.

The application uses three autonomous AI agents (Researcher, Analyst,
Writer) powered by Google Gemini 2.0 to generate professional retail
industry research reports. Reports are saved to a ChromaDB vector store
and are semantically searchable.

The key feature is automated rollout via Docker Compose. When a new
version is merged, GitHub Actions builds fresh images, pushes them to
Docker Hub, and SSH-deploys them to EC2 — ensuring the app is always
running the latest version within minutes of a merge.

---

## Key Features

- Automated CI pipeline triggered on **every commit and pull request**
- Automated CD pipeline triggered on **every merge to `main`**
- Unit and integration tests with pytest for the FastAPI backend
- Frontend build verification on every push
- Docker containerization with multi-stage builds — no local builds needed
- Images pushed to Docker Hub with SHA and `latest` tags
- Zero-downtime deployment via `docker compose pull && docker compose up -d`
- Health-check-driven deployments using the `/api/health` endpoint
- All credentials managed via GitHub Secrets — nothing stored in code or images
- Persistent ChromaDB vector store and knowledge base via Docker volumes

---

## Tech Stack

| Category | Technology |
|---|---|
| Backend | Python 3.11, FastAPI, Uvicorn |
| AI / Agents | Google Gemini 2.0, LangChain, CrewAI |
| Search | Tavily Search API |
| Vector Store | ChromaDB |
| Frontend | React 18, Vite, Tailwind CSS |
| Containerization | Docker, Docker Hub |
| CI/CD | GitHub Actions |
| Cloud | AWS EC2, Ubuntu 22.04 |
| Version Control | Git, GitHub |

---

## Project Structure

```
CI-CD-project/
│
├── backend/
│   ├── Dockerfile                    # Multi-stage Python production image
│   ├── .dockerignore                 # Excluded files from image
│   ├── requirements.txt              # Python dependencies
│   ├── main.py                       # FastAPI entry point
│   ├── .env.example                  # Environment variable template
│   ├── api/
│   │   └── routes.py                 # All API endpoints
│   ├── agents/
│   │   ├── crew_agents.py            # Three CrewAI agent definitions
│   │   ├── crew_tasks.py             # Task pipeline assembly
│   │   └── orchestrator.py           # Session management + SSE streaming
│   ├── core/
│   │   ├── config.py                 # Centralised settings
│   │   ├── llm.py                    # Gemini LLM factory
│   │   └── search.py                 # Tavily search tool
│   ├── knowledge_base/
│   │   ├── __init__.py
│   │   └── repository.py             # ChromaDB + .txt dual-write store
│   └── tests/
│       ├── test_config.py            # Settings unit tests
│       ├── test_health.py            # Health endpoint tests
│       ├── test_research.py          # Research API tests
│       └── test_knowledge.py         # Knowledge base tests
│
├── frontend/
│   ├── Dockerfile                    # Multi-stage React + nginx image
│   ├── .dockerignore
│   ├── nginx.conf                    # Reverse proxy for API + SSE
│   ├── package.json
│   └── src/
│       ├── App.jsx
│       ├── api/client.js             # Axios + SSE client
│       ├── components/
│       │   ├── AgentPipeline.jsx     # Live pipeline visualiser
│       │   ├── ReportViewer.jsx      # Markdown report renderer
│       │   └── Layout.jsx            # Sidebar + status panel
│       └── pages/
│           ├── ResearchPage.jsx      # Main research interface
│           ├── KnowledgePage.jsx     # Semantic + keyword search
│           └── HistoryPage.jsx       # Past session browser
│
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Runs on every push / PR
│       └── deploy.yml                # Runs on merge to main
│
├── docker-compose.yml                # Local development stack
├── docker-compose.prod.yml           # EC2 production overrides
├── nginx.prod.conf                   # Production nginx config
└── .dockerignore                     # Root-level ignore rules
```

---

## Deployment Steps

Follow these steps to deploy this project from scratch.

**Prerequisites**
- AWS account with an EC2 instance (Ubuntu 22.04, t2.micro or t3.small)
- Docker Hub account
- GitHub account with repository access
- Gemini API key (free at aistudio.google.com)
- Tavily API key (free at tavily.com)

---

**Step 1 — Clone this repository**

```bash
git clone https://github.com/awwniket47/CI-CD-project.git
cd CI-CD-project
```

---

**Step 2 — Launch AWS EC2 Instance**

Go to AWS Console → EC2 → Launch Instance. Use the following settings:

```
Name:           retailmind-server
AMI:            Ubuntu Server 22.04 LTS
Instance type:  t3.small (recommended) or t2.micro (free tier)
Key pair:       Create new → download the .pem file
Security group: Allow ports 22 (SSH), 80 (HTTP), 8000 (API)
```

---

**Step 3 — Set up Docker on EC2**

SSH into your instance and install Docker:

```bash
ssh -i your-key.pem ubuntu@<your-ec2-public-ip>

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu
newgrp docker

# Install Docker Compose plugin
sudo apt-get install -y docker-compose-plugin

# Verify
docker --version
docker compose version
```

---

**Step 4 — Prepare the server**

```bash
# Clone the repo on the server
git clone https://github.com/awwniket47/CI-CD-project.git ~/retailmind
cd ~/retailmind

# Create the backend .env file
cat > backend/.env << 'EOF'
GEMINI_API_KEY=your_gemini_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here
KB_DIR=./knowledge_base
CHROMA_DIR=./chroma_db
EOF
```

---

**Step 5 — Add GitHub Secrets**

Go to your GitHub repo → Settings → Secrets and variables → Actions
and add these secrets:

```
DOCKERHUB_USERNAME      → your Docker Hub username
DOCKERHUB_TOKEN         → your Docker Hub access token
EC2_HOST                → your EC2 public IP address
EC2_USERNAME            → ubuntu
EC2_SSH_KEY             → full contents of your .pem file
```

To get the SSH key contents for the secret:

```bash
cat your-key.pem
# Copy everything including -----BEGIN ... and -----END ...
```

---

**Step 6 — Push to trigger the pipeline**

```bash
git add .
git commit -m "feat: initial deployment"
git push origin main
```

Go to the **Actions** tab on GitHub and watch all stages complete.
The pipeline tests the backend, builds both Docker images, pushes
them to Docker Hub, and deploys to EC2 automatically.

---

**Step 7 — Verify the deployment**

```bash
# SSH into EC2 and check running containers
ssh -i your-key.pem ubuntu@<your-ec2-public-ip>
docker ps
```

You should see both `retailmind-backend` and `retailmind-frontend`
containers running.

---

**Step 8 — Get the app URL**

Open your browser and navigate to:

```
http://<your-ec2-public-ip>              → Frontend (RetailMind app)
http://<your-ec2-public-ip>:8000/docs    → FastAPI Swagger docs
http://<your-ec2-public-ip>:8000/api/health → Health check JSON
```

---

## CI/CD Pipeline Stages

```
CI Pipeline — runs on every push and pull request
│
├── Stage 1 — Checkout
│     └─ Pull latest code from branch
│
├── Stage 2 — Backend Tests
│     └─ Setup Python 3.11 with pip cache
│     └─ Install requirements + pytest + ruff
│     └─ Lint with Ruff (E, F, W rules)
│     └─ Run pytest test suite (config, health, research, knowledge)
│
├── Stage 3 — Frontend Build Check
│     └─ Setup Node.js 20 with npm cache
│     └─ npm ci (clean install from lockfile)
│     └─ npm run build (Vite production build)
│
└── Stage 4 — Docker Build Check
      └─ docker build backend image
      └─ docker build frontend image


CD Pipeline — runs only on merge to main
│
├── Stage 1 — Checkout + Run Tests
│     └─ Re-run backend tests as quality gate
│     └─ Re-run frontend build check
│
├── Stage 2 — Build and Push Images
│     └─ Login to Docker Hub
│     └─ Setup Docker Buildx with GHA cache
│     └─ Build + push backend: latest + SHA tag
│     └─ Build + push frontend: latest + SHA tag
│
└── Stage 3 — Deploy to EC2
      └─ SSH into EC2 via appleboy/ssh-action
      └─ cd ~/retailmind && git pull origin main
      └─ docker compose pull (fresh images)
      └─ docker compose up -d --remove-orphans
      └─ docker image prune -f (cleanup old images)
      └─ curl health check → confirm deploy success
```

---

## Zero-Downtime Deployment

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