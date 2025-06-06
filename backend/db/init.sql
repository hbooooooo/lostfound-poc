-- 0. Required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
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
    lang TEXT DEFAULT 'en'
);

-- 4. Found items table
CREATE TABLE IF NOT EXISTS found_items (
    id SERIAL PRIMARY KEY,
    found_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    location TEXT,
    ocr_text TEXT,
    tags TEXT[],
    description TEXT,
    description_score REAL,
    embedding vector(512),
    filename TEXT,
    organization_id INTEGER REFERENCES organizations(id) ON DELETE SET NULL,
    submitted_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

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
