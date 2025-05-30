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
import claimsRoutes from './routes/claims.js';
import claimsVerifyRoutes from './routes/claims_verify_routes.js';
import itemRoutes from './routes/item_and_template_routes.js';
import webhookRoutes from './routes/stripe_webhook.js';
import activityRoutes from './routes/activity_routes.js';
import paymentRoutes from './routes/payment_routes.js';
import progressRoutes from './routes/progress_routes.js';
import confirmRoute from './routes/payment_confirm_route.js';

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
app.use('/api', itemRoutes);
app.use('/api/claims', claimsRoutes);
app.use('/api/claims', claimsVerifyRoutes); // Both under /api/claims
app.use(webhookRoutes); // no prefix, Stripe requires exact path
app.use('/api', activityRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api', progressRoutes);
app.use('/api/payment', confirmRoute);

// 📁 File path helpers
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const upload = multer({ dest: path.join(__dirname, '../uploads') });
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Until de do better with real labels
app.use('/labels', express.static(path.join(__dirname, '../labels')));

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
    // console.log(`📸 Received file at ${filePath}`);

    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));

    const response = await axios.post('http://ml_service/ocr', formData, {
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
        JSON.stringify(embedding),
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

app.post('/api/search', authenticateToken, async (req, res) => {
  const { keyword, startDate, endDate, embedding } = req.body;

  try {
    const params = [req.user.organization_id];
    let conditions = ['fi.organization_id = $1'];
    let similarityExpr = 'NULL';

    if (keyword && keyword.trim().length > 0) {
      const kw = `%${keyword.trim().toLowerCase()}%`;

      params.push(kw); // ocr_text
      const ocrIdx = params.length;

      params.push(kw); // tags
      const tagsIdx = params.length;

      params.push(kw); // location
      const locIdx = params.length;

      conditions.push(`(
        LOWER(ocr_text) LIKE $${ocrIdx}
        OR EXISTS (
          SELECT 1 FROM unnest(tags) t WHERE LOWER(t) LIKE $${tagsIdx}
        )
        OR LOWER(location) LIKE $${locIdx}
      )`);
    }

    if (startDate) {
      params.push(startDate);
      conditions.push(`found_at >= $${params.length}`);
    }

    if (endDate) {
      params.push(endDate);
      conditions.push(`found_at <= $${params.length}`);
    }

    if (embedding && Array.isArray(embedding) && embedding.length === 512) {
      const vectorLiteral = `[${embedding.join(',')}]`;
      params.push(vectorLiteral);
      similarityExpr = `(-(embedding <#> $${params.length}::vector))`;
    }

    const query = `
      SELECT fi.*, c.claim_initiated, c.verified, c.shipping_confirmed, c.payment_status, c.shipped, ${similarityExpr} AS similarity
      FROM found_items fi
      LEFT JOIN claims c ON c.item_id = fi.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY ${embedding ? 'similarity DESC NULLS LAST' : 'found_at DESC'}
      LIMIT 20
    `;

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

// 🏷️ Expose vocabulary to ml_service
app.get('/api/tags/vocabulary', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tag_vocabulary');
    const tags = result.rows.map(row => row.label);
    res.json(tags);
  } catch (err) {
    console.error('[Vocabulary Error]', err);
    res.status(500).json({ error: 'Failed to fetch tag vocabulary' });
  }
});

app.get('/api/tags/frequent', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT unnest(tags) AS tag, COUNT(*) AS count
      FROM found_items
      WHERE organization_id = $1
      GROUP BY tag
      ORDER BY count DESC
      LIMIT 50
    `;
    const result = await pool.query(query, [req.user.organization_id]);
    res.json(result.rows);  // [{tag: 'wallet', count: 12}, ...]
  } catch (err) {
    console.error('[Tag Aggregation Error]', err);
    res.status(500).json({ error: 'Could not fetch frequent tags' });
  }
});

app.post('/api/tags/vocabulary', authenticateToken, async (req, res) => {
  const { label } = req.body;
  try {
    await pool.query('INSERT INTO tag_vocabulary (label) VALUES ($1) ON CONFLICT DO NOTHING', [label.toLowerCase()]);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('[Add Tag Error]', err);
    res.status(500).json({ error: 'Failed to add tag' });
  }
});

app.delete('/api/tags/vocabulary', authenticateToken, async (req, res) => {
  const { label } = req.body;
  try {
    await pool.query('DELETE FROM tag_vocabulary WHERE label = $1', [label.toLowerCase()]);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('[Delete Tag Error]', err);
    res.status(500).json({ error: 'Failed to delete tag' });
  }
});

app.post('/api/claims/mark-shipped', async (req, res) => {
  const { item_id } = req.body;
  if (!item_id) return res.status(400).json({ error: 'Missing item_id' });
  // Assigned a MOCK LABEL for now
  try {
    const result = await pool.query(
      `UPDATE claims
       SET shipped = true, shipping_label = 'mock-label.pdf'
       WHERE item_id = $1`,
      [item_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Claim not found for item_id' });
    }

    console.log(`📦 Marked item ${item_id} as shipped and assigned label`);
    res.json({ status: 'ok' });
  } catch (err) {
    console.error('[Mark Shipped Error]', err);
    res.status(500).json({ error: 'Failed to mark item as shipped' });
  }
});
