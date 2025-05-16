import express from 'express';
import multer from 'multer';
import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const { Pool } = pkg;

// 📦 DB connection
const pool = new Pool({
  user: 'user',
  host: 'db',
  database: 'mydb',
  password: 'password',
  port: 5432
});

const app = express();
app.use(cors());
app.use(express.json());

// 📁 File path helpers
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const upload = multer({ dest: path.join(__dirname, '../uploads') });
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 🔐 JWT middleware
function authenticateToken(req, res, next) {
  const auth = req.headers.authorization;
  const token = auth && auth.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Missing token' });

  jwt.verify(token, process.env.JWT_SECRET || 'changeme', (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

// 🧾 Signup
app.post('/api/signup', async (req, res) => {
  const { username, password, organization } = req.body;
  if (!username || !password || !organization) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    // Create org if not exists
    const orgResult = await pool.query('SELECT id FROM organizations WHERE name = $1', [organization]);
    let orgId;
    if (orgResult.rows.length === 0) {
      const insert = await pool.query('INSERT INTO organizations(name) VALUES ($1) RETURNING id', [organization]);
      orgId = insert.rows[0].id;
    } else {
      orgId = orgResult.rows[0].id;
    }

    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (username, password, organization_id)
       VALUES ($1, $2, $3) RETURNING id, username, organization_id`,
      [username, hashed, orgId]
    );

    res.json({ status: 'ok', user: result.rows[0] });
  } catch (err) {
    console.error('[Signup Error]', err);
    res.status(500).json({ error: 'Signup failed' });
  }
});

// 🔐 Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, organization_id: user.organization_id },
      process.env.JWT_SECRET || 'changeme',
      { expiresIn: '1d' }
    );

    res.json({ token });
  } catch (err) {
    console.error('[Login Error]', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// 🧠 OCR
app.post('/api/ocr', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const filePath = req.file.path;
    console.log(`📸 Received file at ${filePath}`);

    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));

    const response = await axios.post('http://ml_service:80/ocr', formData, {
      headers: formData.getHeaders()
    });

    res.json({
      ...response.data,
      filename: req.file.filename
    });
  } catch (err) {
    console.error('[OCR Error]', err);
    res.status(500).json({ error: 'OCR failed' });
  }
});

// 💾 Save item (requires login)
app.post('/api/items', authenticateToken, async (req, res) => {
  const {
    text,
    tags,
    embedding,
    location,
    foundAt,
    filename,
    description,
    description_score
  } = req.body;

  if (!embedding || !Array.isArray(embedding)) {
    return res.status(400).json({ error: 'Missing or invalid embedding array' });
  }

  try {
    await pool.query(
      `INSERT INTO found_items (
        ocr_text, tags, embedding, location, found_at,
        filename, description, description_score, organization_id, submitted_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        text,
        tags,
        embedding,
        location || null,
        foundAt,
        filename || null,
        description || null,
        description_score || null,
        req.user.organization_id,
        req.user.id
      ]
    );

    res.json({ status: 'ok' });
  } catch (err) {
    console.error('[Insert Error]', err);
    res.status(500).json({ error: 'Insert failed' });
  }
});

// 🔍 Search (limited to user’s org)
app.post('/api/search', authenticateToken, async (req, res) => {
  const { keyword, startDate, endDate } = req.body;

  try {
    let query = 'SELECT * FROM found_items WHERE organization_id = $1';
    const params = [req.user.organization_id];

    if (keyword) {
      params.push(`%${keyword.toLowerCase()}%`);
      query += ` AND (LOWER(ocr_text) LIKE $${params.length} OR $${params.length} = ANY(tags))`;
    }

    if (startDate) {
      params.push(startDate);
      query += ` AND found_at >= $${params.length}`;
    }

    if (endDate) {
      params.push(endDate);
      query += ` AND found_at <= $${params.length}`;
    }

    query += ' ORDER BY found_at DESC LIMIT 20';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('[Search Error]', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

// 🚀 Start server
app.listen(3000, () => {
  console.log('✅ Backend running on port 3000');
});

