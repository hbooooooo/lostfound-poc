# Lost & Found POC — Working Summary

This summary captures the current architecture, key endpoints, and recent changes so we can quickly resume next session.

## Stack Overview
- Backend: Node.js/Express (`backend/`), Postgres with pgvector (via `ankane/pgvector`), JWT auth.
- Frontend: Vue 3 + Vite (`frontend/`).
- ML Service: FastAPI (`ml_service/`) with PaddleOCR (OCR), BLIP (caption), CLIP (tags + 512‑d embedding).
- Nginx: Fronts the dev server in Docker.
- Docker Compose: `docker-compose.yml` (GPU), optional CPU override: `docker-compose.cpu.yml`.

## Service Ports
- Backend: `3000` (container + host)
- Frontend (via Nginx): `5173`
- ML Service: `8001` → container port `80`
- Postgres: internal only

## Environment Variables (not exhaustive)
- `JWT_SECRET`: Backend JWT signing (default `changeme`).
- `ML_SERVICE_URL`: Backend -> ML base URL (default `http://ml_service`).
- `DEFAULT_ORG_NAME`: Org backfill target name (default `TestOrg`).

## How to Run
- All services: `./start_lostfound.sh` (runs `docker compose up -d`).
- CPU‑only ML service: `docker compose -f docker-compose.yml -f docker-compose.cpu.yml up -d --build ml_service`.
- Health checks:
  - ML direct: `curl http://localhost:8001/health`
  - ML via backend: `curl http://localhost:3000/api/ml/health`
  - Backend test: `curl http://localhost:3000/api/test`

## Data Model (relevant tables)
- `organizations(id, name, origin_address JSONB?)`
- `users(id, username, password, organization_id)`
- `found_items(id, found_at, location, ocr_text, tags TEXT[], description, description_score, embedding vector(512), filename, organization_id, submitted_by)`
- `claims(id UUID, item_id, email, token, token_expires, claim_initiated, verified, shipping_label, shipping_confirmed, payment_status, shipped, delivered, ...)`

Note: On startup, backend ensures `origin_address` exists and backfills any `found_items.organization_id IS NULL` to `DEFAULT_ORG_NAME` (default `TestOrg`).

## Key Backend Endpoints
- Auth:
  - `POST /api/signup`
  - `POST /api/login` → returns `token`
- OCR/ML:
  - `POST /api/ocr` [multipart file] → calls ML at `${ML_SERVICE_URL}/ocr`. Returns `text`, `tags` (1 best), `embedding[512]`, `description`, `filename`.
  - `GET /api/ml/health` → backend → ML health proxy.
- Items:
  - `POST /api/items` (auth) → saves item (embeddings cast to `vector`, requires 512 dims).
  - `POST /api/search` (auth) → filters by `req.user.organization_id`, optional keyword/date, optional embedding similarity.
  - `GET /api/items/:id` (auth) → restricted to caller’s org.
- Tags:
  - `GET /api/tags/vocabulary`
  - `GET /api/tags/frequent` (auth, scoped by org)
  - `POST /api/tags/vocabulary` (auth)
  - `DELETE /api/tags/vocabulary` (auth)
- Claims & Activity:
  - `POST /api/claims/initiate` (auth) → restricted to caller’s org for the item.
  - `GET /api/claims/activity` (auth) → restricted to caller’s org.
  - `POST /api/claims/mark-shipped` (auth) → restricted to caller’s org.
- Admin (all under `/api/admin`, auth required; simple requireAdmin placeholder):
  - `GET /api/admin/organizations` → ensures `origin_address` column, returns counts via subqueries (correct counts).
  - `POST /api/admin/organizations`, `PUT /api/admin/organizations/:id`, `DELETE /api/admin/organizations/:id` (ensures `origin_address`).
  - `GET/POST/PUT/DELETE /api/admin/users...`

## Frontend Highlights
- `Record.vue` (Upload & Process):
  - HEIC handled client‑side via `heic2any` (JPEG conversion, size limits). Calls `/api/ocr`. Shows description/OCR/tags. Saves via `/api/items` (auth).
- `Activity.vue`: Uses `/api/search` to display items in two groups; marks shipped via `/api/claims/mark-shipped` (now auth + org check).
- `ClaimForm.vue`: Loads item via `/api/items/:id` (now auth + org check), sends claim initiation.
- `OrganizationManagement.vue`: Uses admin org endpoints. Fixed DB mismatch on `origin_address` and corrected counts.
- `TagAdmin.vue`: Tag list sorted A→Z; frequent tags loaded per org.

## ML Service Notes (`ml_service/`)
- OCR: PaddleOCR primary (kept as requested). Optional Tesseract fallback is off by default (`ENABLE_TESSERACT_FALLBACK=0`).
- Vision: BLIP caption, CLIP image embedding (512), and tag selection.
- Tagging: returns a single best tag after:
  - Prompt ensembling per label (several templates averaged).
  - Vocabulary normalization (lowercase, simple plural→singular).
  - Score boosting if label appears in caption/description/OCR.
- Warmup: downloads PaddleOCR models on first startup; `@app.on_event("startup")` preloads lightly.

## Recent Fixes & Enhancements
- OCR pipeline syntax error fixed; ml_service now starts cleanly.
- Added `ML_SERVICE_URL` and `/api/ml/health` for reliability and debugging.
- `/api/items` insert: cast embedding to `vector` and validate 512 dims.
- Admin org list: ensure `origin_address` column exists; query rewritten to avoid overcounting and missing column.
- Org segregation enforced:
  - `GET /api/items/:id`, `POST /api/claims/initiate`, `GET /api/claims/activity`, `POST /api/claims/mark-shipped` all require JWT and check item org.
  - Startup backfill: assign null `found_items.organization_id` to `TestOrg`.
- Tag Admin UI sorted alphabetically.
- Description no longer starts with the chosen tag (cleaner phrasing).

## Known/Next
- Tagging tweaks: consider synonyms (e.g., umbrella/brolly/parasol), per‑org priors, or uncertainty threshold for very low scores.
- RBAC: add proper roles for admin endpoints.
- Migrations: a proper migration system (instead of on‑route `ALTER TABLE`) if needed.
- Caching vocab: cache `/api/tags/vocabulary` in ml_service with periodic refresh.

## Quick Commands
- `docker compose ps`
- Logs: `docker compose logs --tail=200 backend|ml_service`
- Rebuild one: `docker compose up -d --build ml_service`

This file is maintained to keep context across sessions. Update as we change flows or APIs.
