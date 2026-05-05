# RetailMind — Autonomous Retail Research Agent

A complete DevOps implementation for containerizing and deploying a full-stack AI-powered Retail Research Application onto AWS EC2 using Docker, GitHub Actions CI/CD, and a Python FastAPI backend with a React frontend — with automated testing on every commit, zero-downtime deployments on every merge to `main`, and a versioned rollback system for production safety.

---

## Project Overview

This project takes a full-stack **RetailMind** application — built with FastAPI (Python) on the backend and React + Vite on the frontend — and deploys it to a production-grade AWS EC2 instance. The deployment is fully automated: a single `git push` triggers the entire test, build, push, and deploy pipeline with no manual steps required.

The application uses three autonomous AI agents (Researcher, Analyst, Writer) powered by Google Gemini 2.0 to generate professional retail industry research reports. Reports are saved to a ChromaDB vector store and are semantically searchable.

The key feature is automated rollout via Docker Compose. When a new version is merged, GitHub Actions builds fresh images, pushes them to Docker Hub, and SSH-deploys them to EC2 — ensuring the app is always running the latest version within minutes of a merge. Every deployment is version-tracked by its git SHA, enabling one-click rollback to any previous deployment directly from GitHub Actions.

---

## Key Features

- Automated CI pipeline triggered on **every commit and pull request**
- Automated CD pipeline triggered on **every merge to `main`**
- **Versioned deployments** — every deploy is tagged with its git SHA and recorded in `deployments.log`
- **One-click rollback** — manually trigger rollback to previous or any specific deployment from GitHub Actions
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
Retailmind-Autonomous_Retail_Research_Agent/
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
│       ├── deploy.yml                # Runs on merge to main
│       └── rollback.yml              # Manually triggered rollback
│
├── docker-compose.yml                # Local development stack
├── docker-compose.prod.yml           # EC2 production overrides
├── nginx.prod.conf                   # Production nginx config
└── .dockerignore                     # Root-level ignore rules
```

---

## CI/CD Pipeline

This project uses three separate GitHub Actions workflows following the industry standard separation of concerns.

### CI Workflow — runs on every push and pull request

```
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
```

### CD Workflow — runs only on merge to main

```
├── Stage 1 — Run Tests (quality gate)
│
├── Stage 2 — Build and Push Images
│     └─ Login to Docker Hub
│     └─ Build + push backend: latest + SHA tag
│     └─ Build + push frontend: latest + SHA tag
│
└── Stage 3 — Deploy to EC2
      └─ SSH into EC2
      └─ git pull + docker compose pull
      └─ docker compose up -d --remove-orphans
      └─ Health check → confirm deploy success
      └─ Record SHA + timestamp to deployments.log
```

### Rollback Workflow — manually triggered from GitHub Actions

```
├── Input: Git SHA (optional — leave empty for previous deployment)
│
├── Read deployments.log on EC2
│     └─ Use provided SHA or pick second entry (previous deploy)
│
├── Pull pinned images from Docker Hub
│     └─ backend:<SHA> + frontend:<SHA>
│
├── Deploy pinned version via docker compose
│     └─ ROLLBACK_SHA env var overrides :latest tag
│
└── Health check + record rollback entry in deployments.log
```

---

## Versioning and Rollback System

Every deployment is immutably tagged with its git SHA on Docker Hub:

```
yourname/retailmind-backend:latest
yourname/retailmind-backend:659c66771a5a2decc760e2c4785a5e7d6a29c078
```

A rolling log of the last 10 deployments is maintained on EC2 at `~/deployments.log`:

```
2026-05-05T11:31:24Z 659c667... (rollback)
2026-05-05T11:28:40Z 732601e...
2026-05-05T11:13:08Z 659c667...
```

To rollback: GitHub → Actions → Rollback Deployment → Run workflow. Leave SHA empty to go back one version, or paste any SHA from the log to go back further. Rollback completes in under 60 seconds without rebuilding from source.

The `${ROLLBACK_SHA:-latest}` pattern in `docker-compose.prod.yml` means normal deployments are completely unaffected — `ROLLBACK_SHA` is only set during a rollback run.

---

## Deployment Steps

**Prerequisites**
- AWS account with an EC2 instance (Ubuntu 22.04, t2.micro or t3.small)
- Docker Hub account
- GitHub account with repository access
- Gemini API key (free at aistudio.google.com)
- Tavily API key (free at tavily.com)

**Step 1 — Clone this repository**

```bash
git clone https://github.com/awwniket47/Retailmind-Autonomous_Retail_Research_Agent.git
cd Retailmind-Autonomous_Retail_Research_Agent
```

**Step 2 — Launch AWS EC2 Instance**

```
Name:           retailmind-server
AMI:            Ubuntu Server 22.04 LTS
Instance type:  t3.small (recommended) or t2.micro (free tier)
Key pair:       Create new → download the .pem file
Security group: Allow ports 22 (SSH), 80 (HTTP), 8000 (API)
```

**Step 3 — Set up Docker on EC2**

```bash
ssh -i your-key.pem ubuntu@<your-ec2-public-ip>
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu
newgrp docker
sudo apt-get install -y docker-compose-plugin
```

**Step 4 — Prepare the server**

```bash
git clone https://github.com/awwniket47/Retailmind-Autonomous_Retail_Research_Agent.git ~/retailmind
cd ~/retailmind
cat > backend/.env << 'EOF'
GEMINI_API_KEY=your_gemini_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here
KB_DIR=./knowledge_base
CHROMA_DIR=./chroma_db
EOF
```

**Step 5 — Add GitHub Secrets**

```
DOCKERHUB_USERNAME      → your Docker Hub username
DOCKERHUB_TOKEN         → your Docker Hub access token
EC2_HOST                → your EC2 public IP address
EC2_USERNAME            → ubuntu
EC2_SSH_KEY             → full contents of your .pem file
GEMINI_API_KEY          → your Gemini API key
TAVILY_API_KEY          → your Tavily API key
```

**Step 6 — Push to trigger the pipeline**

```bash
git push origin main
```

**Step 7 — Verify the deployment**

```
http://<your-ec2-public-ip>           → Frontend
http://<your-ec2-public-ip>:8000/docs → FastAPI Swagger docs
http://<your-ec2-public-ip>:8000/api/health → Health check
```

---

## Running Locally

```bash
cp backend/.env.example backend/.env
# Fill in your API keys in backend/.env
docker compose up --build
```

---

## GitHub Secrets Required

| Secret | Description |
|---|---|
| `DOCKERHUB_USERNAME` | Docker Hub account username |
| `DOCKERHUB_TOKEN` | Docker Hub access token |
| `EC2_HOST` | Public IP of your EC2 instance |
| `EC2_USERNAME` | SSH username (typically `ubuntu`) |
| `EC2_SSH_KEY` | Full PEM private key content |
| `GEMINI_API_KEY` | Google Gemini API key |
| `TAVILY_API_KEY` | Tavily Search API key |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Yes | Google Gemini API key for LLM |
| `TAVILY_API_KEY` | Yes | Tavily Search API key for web search |
| `KB_DIR` | No | Knowledge base directory (default: `./knowledge_base`) |
| `CHROMA_DIR` | No | ChromaDB directory (default: `./chroma_db`) |

---

## Zero-Downtime Deployment

Docker Compose pulls the new image while the old container is still running. The `up -d` command replaces containers one service at a time, and the backend health check at `/api/health` confirms the new container is live before the old one is removed. The frontend nginx container serves cached static files during the transition.

---

## Group Members

| Name | Enrollment Number |
|---|---|
| Aniket Kushwah | EN22CS301124 |
| Arsh Patidar | EN22CS301204 |
| Amit Patidar | EN22CS301114 |
| Anurag Didolkar | EN22CS301169 |
| Anuj Singh Rathore | EN22CS301166 |
| Avani Gupta | EN22CS301236 |

---

## Faculty

| Name | Role |
|---|---|
| Prof. Akshay Saxena | Industry Mentor |
| Dr. Hemlata Patel | Faculty Guide |
| Prof. Ajeet Singh Rajput | Faculty Guide |

---

- **Institution** — Medicaps University, Datagami Skill Based Course
- **Academic Year** — 2025–2026