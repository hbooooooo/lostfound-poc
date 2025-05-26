-- 1. Organizations table
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS organizations (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

-- 2. Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,  -- You can hash this in the app layer later
    organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE
);

-- 3. Items table (modified)
CREATE TABLE IF NOT EXISTS tag_vocabulary (
  id SERIAL PRIMARY KEY,
  label TEXT NOT NULL UNIQUE,
  lang TEXT DEFAULT
);

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

-- 4. Claims table
CREATE TABLE IF NOT EXISTS claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id INTEGER NOT NULL REFERENCES found_items(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    token_expires TIMESTAMP NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);