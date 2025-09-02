-- 0. Required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trigram indexes to speed LIKE/similarity across common text fields
CREATE INDEX IF NOT EXISTS idx_found_items_ocr_text_trgm ON found_items USING gin (ocr_text gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_found_items_description_trgm ON found_items USING gin (description gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_found_items_location_trgm ON found_items USING gin (location gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_claims_email_trgm ON claims USING gin (email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_claims_owner_name_trgm ON claims USING gin ((lower(coalesce(nullif(trim(shipping_address->>'name'), ''), split_part(email, '@', 1)))) gin_trgm_ops);

-- 1. Organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    origin_address JSONB
);

-- 2. Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE
);

-- 3. Tag vocabulary table
CREATE TABLE IF NOT EXISTS tag_vocabulary (
    id SERIAL PRIMARY KEY,
    label TEXT NOT NULL UNIQUE,
    lang TEXT DEFAULT 'en',
    default_length_cm REAL,
    default_width_cm REAL,
    default_height_cm REAL,
    default_weight_kg REAL,
    default_is_document BOOLEAN
);

-- 4. Found items table
CREATE TABLE IF NOT EXISTS found_items (
    id SERIAL PRIMARY KEY,
    found_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    record_number TEXT,
    location TEXT,
    ocr_text TEXT,
    tags TEXT[],
    description TEXT,
    description_score REAL,
    embedding vector(512),
    filename TEXT,
    -- Shipping-related estimates
    length_cm REAL,
    width_cm REAL,
    height_cm REAL,
    weight_kg REAL,
    is_document BOOLEAN,
    organization_id INTEGER REFERENCES organizations(id) ON DELETE SET NULL,
    submitted_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- Ensure uniqueness of record numbers when present
CREATE UNIQUE INDEX IF NOT EXISTS uniq_found_items_record_number ON found_items(record_number) WHERE record_number IS NOT NULL;

-- 5. Claims table
CREATE TABLE IF NOT EXISTS claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id INTEGER NOT NULL REFERENCES found_items(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    token_expires TIMESTAMP NOT NULL,
    claim_initiated BOOLEAN DEFAULT FALSE,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    shipping_label TEXT,
    shipping_confirmed BOOLEAN DEFAULT FALSE,
    tc_agreed BOOLEAN DEFAULT FALSE,
    payment_session_id TEXT,
    payment_status TEXT,
    shipped BOOLEAN DEFAULT FALSE,
    shipping_address JSONB,
    delivered BOOLEAN DEFAULT FALSE
);
