# Template Stack Guide

This document summarizes the stack and provides step‑by‑step instructions to spin up a new app with the same architecture in a separate repository.

## Stack Overview
- Backend: Node.js + Express, Postgres (pg + pgvector), JWT auth, Multer (uploads), Stripe webhook (raw body), axios.
- ML Service: FastAPI with PaddleOCR (OCR), BLIP (caption), CLIP (tags + text embeddings).
- Frontend: Vue 3 + Vite, Axios; SPA with JWT stored client‑side.
- Infra: Docker Compose orchestrating `db`, `backend`, `frontend` (dev server), `ml_service`, and `nginx`.
- Security: helmet, configurable CORS, rate‑limits; org‑scoped data access; pg_trgm + GIN indexes for fuzzy search; optional IVFFlat (vector) index.

## Services & Default Ports (current project)
- Backend: 3000 (host:container)
- Frontend via Nginx: 5173 (host → 443 in container → Vite dev 4173)
- ML Service: 8001 (host → 80 in container)
- Postgres: internal only

## Create a New App (Recommended Flow)
1) Create an empty GitHub repo for the new app (or prepare a local folder):
   - e.g., `my-new-app`
2) From this project, export a template:
   - Run: `./tools/export_template.sh ../my-new-app MyNewApp 3001 5174 8002`
     - Creates `../my-new-app` with copied services and adjusted ports:
       - backend: 3001, nginx: 5174, ml_service: 8002
       - COMPOSE_PROJECT_NAME=MyNewApp in `.env`
3) Initialize Git and push:
   - `cd ../my-new-app && git init`
   - `git add -A && git commit -m "chore: bootstrap from template"`
   - `git remote add origin git@github.com:<you>/<my-new-app>.git`
   - `git push -u origin main`
4) Start services:
   - `./start_lostfound.sh` or `docker compose up -d --build`
   - Health checks:
     - `curl http://localhost:3001/api/test`
     - `curl http://localhost:3001/api/ml/health`

## Configuration
- Copy `.env.example` → `.env` and set at least:
  - `JWT_SECRET=...` (required in production)
  - `DEFAULT_ORG_NAME=...`
  - `ML_SERVICE_URL=http://ml_service`
  - `CORS_ORIGINS=https://your-hostname.tld`
  - Stripe keys if using payments.

## Notes
- Compose project names, ports, and volume names must be unique per app if running in parallel.
- Nginx listens on the host port you choose (e.g., 5174); Vite runs on 4173 internally.
- For production, build the frontend and serve static assets via Nginx; disable the dev server.
