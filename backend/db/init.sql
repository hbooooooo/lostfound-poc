-- 1. Organizations table
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
CREATE TABLE IF NOT EXISTS found_items (
    id SERIAL PRIMARY KEY,
    found_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    location TEXT,
    ocr_text TEXT,
    tags TEXT[],
    description TEXT,
    embedding FLOAT8[],
    filename TEXT,
    organization_id INTEGER REFERENCES organizations(id) ON DELETE SET NULL,
    submitted_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);
