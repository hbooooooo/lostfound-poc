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
- `tag_vocabulary(label UNIQUE, lang, default_length_cm, default_width_cm, default_height_cm, default_weight_kg, default_is_document)`
- `found_items(id, record_number, found_at, location, ocr_text, tags TEXT[], description, description_score, embedding vector(512), filename, length_cm, width_cm, height_cm, weight_kg, is_document, organization_id, submitted_by)`
- `claims(id UUID, item_id, email, token, token_expires, claim_initiated, verified, shipping_label, shipping_confirmed, payment_status, shipped, delivered, shipping_address JSONB, ...)`

Note: On startup, backend ensures `origin_address` exists and backfills any `found_items.organization_id IS NULL` to `DEFAULT_ORG_NAME` (default `TestOrg`).

## Key Backend Endpoints
- Auth:
  - `POST /api/signup`
  - `POST /api/login` → returns `token`
- OCR/ML:
  - `POST /api/ocr` [multipart file] → calls ML at `${ML_SERVICE_URL}/ocr`. Returns `text`, `tags` (1 best), `embedding[512]`, `description`, `filename`.
  - `GET /api/ml/health` → backend → ML health proxy.
- Items:
  - `POST /api/items` (auth) → saves item (embeddings cast to `vector`, requires 512 dims), generates and returns `{ id, record_number }`.
  - `POST /api/search` (auth) → org‑scoped search combining keyword LIKE filters + semantic similarity. If no results: semantic‑only fallback; if no embedding: fuzzy LIKE fallback (pg_trgm). Ranking: text boost → fuzzy score → similarity.
  - `GET /api/items/:id` (auth) → restricted to caller’s org.
- Dashboard & Notifications:
  - `GET /api/dashboard/summary` (auth) → org‑scoped stats + last 3 items.
  - `GET /api/notifications/summary` (auth) → `{ ready_to_ship }` count for bell indicator.
- Tags:
  - `GET /api/tags/vocabulary` → labels only (ML vocabulary).
  - `GET /api/tags/vocabulary/details` (auth) → labels + default dims.
  - `POST /api/tags/vocabulary` (auth) → upsert label + default dims.
  - `PUT /api/tags/vocabulary` (auth) → update defaults for a label.
  - `GET /api/tags/frequent` (auth, scoped by org)
- Claims & Activity:
  - `POST /api/claims/initiate` (auth) → restricted to caller’s org; requires either L+W+H+weight or document+weight. Stores values on item.
  - `GET /api/claims/activity` (auth) → restricted to caller’s org.
  - `POST /api/claims/mark-shipped` (auth) → restricted to caller’s org.
  - `POST /api/shipping/rates` → mock rating uses origin/destination + package details (document vs volumetric/actual weight).
- Profile:
  - `GET /api/me` (auth) → id, username, organization_id, display_name, avatar.
  - `PUT /api/me` (auth) → update `display_name`.
  - `PUT /api/me/password` (auth) → requires `current_password`, sets `new_password`.
  - `POST /api/me/avatar` (auth, multipart) → upload avatar file.
- Admin (all under `/api/admin`, auth required; simple requireAdmin placeholder):
  - `GET /api/admin/organizations` → ensures `origin_address` column, returns counts via subqueries (correct counts).
  - `POST /api/admin/organizations`, `PUT /api/admin/organizations/:id`, `DELETE /api/admin/organizations/:id` (ensures `origin_address`).
  - `GET/POST/PUT/DELETE /api/admin/users...`

## Frontend Highlights
- `Record.vue` (Upload & Process):
  - HEIC handled client‑side via `heic2any` (JPEG conversion, size limits). Calls `/api/ocr`. Shows description/OCR; tags now inline next to AI confidence. Saves via `/api/items` (auth). Success shows record number.
- `Activity.vue`: Uses `/api/search` to display items in two groups; marks shipped via `/api/claims/mark-shipped` (now auth + org check).
- Headers (Desktop/Mobile): Show avatar if present, otherwise initial; bell shows red dot only when there are items ready to ship (uses `/api/notifications/summary`).
- `ClaimForm.vue` (Initiate Return): Loads item; prefills package details from first tag defaults when not present; requires dims+weight or document+weight; hides L/W/H when document; shows record # and source tag for defaults.
- `OrganizationManagement.vue`: Uses admin org endpoints. Fixed DB mismatch on `origin_address` and corrected counts.
- `TagAdmin.vue`: Manage labels + default dims; frequent tags per org. Uses `/api/tags/vocabulary/details`.
- `Profile.vue`: Self‑service profile (display name, password with current‑password check, avatar upload with client‑side crop/resize).
- `Login.vue`: Polished hero with sample image + gradient; fake “Forgot password?” modal.

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
- Dashboard summary endpoint + portal wiring (recent 3 items + org‑scoped stats).
- Notifications summary endpoint; bell red dot only when items are ready to ship.
- Profile endpoints (`/api/me*`) and UI (avatar/name/password with current password).
- Login page redesign with hero + fake reset modal; static samples served via `/samples` (Docker volume mounted).
- Search UX: combined semantic + keyword search with fallbacks; trigram fuzzy boost + GIN indexes; description included; owner_name search; merged status filters; shipment tracking popup; fixed Dashboard overflow.
- Shipping/Returns: capture dims at Initiate Return; strict validation; mock rating accounts for doc vs volumetric/actual weight.
- Tags: added default dims per tag; admin endpoints and UI.
- Items: generated `record_number` for new items and backfilled for existing; displayed across Search, Activity, Claim.
- Nginx upstream resolution stabilized with Docker DNS resolver; ML health + URL config.

## Known/Next
- Tagging tweaks: consider synonyms (e.g., umbrella/brolly/parasol), per‑org priors, or uncertainty threshold for very low scores.
- RBAC: add proper roles for admin endpoints.
- Migrations: move from on‑startup `ALTER TABLE` to a proper system.
- Caching vocab: cache `/api/tags/vocabulary` in ml_service with periodic refresh.

## Quick Commands
- `docker compose ps`
- Logs: `docker compose logs --tail=200 backend|ml_service`
- Rebuild one: `docker compose up -d --build ml_service`

This file is maintained to keep context across sessions. Update as we change flows or APIs.
