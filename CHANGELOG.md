# Changelog

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

