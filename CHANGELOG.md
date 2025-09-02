# Changelog

## v2025.09.02.2 — Shipping, Tags, Record Numbers, Search polish

- Record numbers:
  - Added `record_number` to `found_items` with a unique index; generated as `R<orgId>-<itemId>`.
  - Backfilled all existing items; displayed across Search, Activity, and Initiate Return.
  - `/api/items` now returns `{ id, record_number }` on create; Record page shows it on success.
- Shipping/returns flow:
  - Moved package dimensions capture to Initiate Return (not at record time).
  - Initiate Return requires either L+W+H+weight or document+weight; hides L/W/H when “Document only”.
  - `/api/shipping/rates` considers document flag and volumetric/actual weight.
- Tag defaults:
  - Added per-tag default dimensions (`tag_vocabulary` columns) and admin UI to manage them.
  - New endpoints: `GET /api/tags/vocabulary/details`, `POST /api/tags/vocabulary` (upsert), `PUT /api/tags/vocabulary`.
  - Initiate Return prefills package fields from the first tag when item lacks values; shows which tag was used.
- Search quality and ranking:
  - Combined keyword LIKE filters with semantic similarity by default; added semantic-only fallback when LIKE blocks fuzzy matches.
  - Added pg_trgm fuzzy LIKE fallback when no embedding; created GIN trigram indexes.
  - Ranking prioritizes text match boost → fuzzy score → semantic similarity.
- UI cleanups:
  - Record page: removed package block; tags now inline next to AI confidence.
  - Initiate Return: cleaner layout; required browser tooltips for missing fields.

## v2025.09.02 — Search and UX improvements

- Backend search: include `description` in keyword matching; expose `owner_name` when verified; allow searching by owner name/email.
- Semantic text search: backend can request CLIP text embeddings from ML service (`/embed_text`) and rank by vector similarity; owner fields still matched via LIKE in semantic mode.
- ML Service: new `/embed_text` endpoint returns 512‑d CLIP text embeddings.
- Search UI:
  - Added “Use closest match instead of exact” toggle with tooltip (semantic mode).
  - Merged three status filters into a single “Owner actions complete”.
  - Show owner name on items when identified; consistent CTA button.
  - Added fake shipment tracking modal when clicking “In transit” or “Delivered”.
- Dashboard: fixed text overflow in Recent Activity tile.
- Activity: show owner name when identified.
