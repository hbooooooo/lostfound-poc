import express from 'express';
import multer from 'multer';
import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from './db.js';
import claimsRoutes from './routes/claims.js';
import claimsVerifyRoutes from './routes/claims_verify_routes.js';
import itemRoutes from './routes/item_and_template_routes.js';
import webhookRoutes from './routes/stripe_webhook.js';
import activityRoutes from './routes/activity_routes.js';
import paymentRoutes from './routes/payment_routes.js';
import progressRoutes from './routes/progress_routes.js';
import confirmRoute from './routes/payment_confirm_route.js';
import adminRoutes from './routes/admin_routes.js';
import shippingRoutes from './routes/shipping_routes.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));
app.use('/api', itemRoutes);
app.use('/api/claims', claimsRoutes);
app.use('/api/claims', claimsVerifyRoutes); // Both under /api/claims
app.use(webhookRoutes); // no prefix, Stripe requires exact path
app.use('/api', activityRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api', progressRoutes);
app.use('/api/payment', confirmRoute);
app.use('/api', shippingRoutes);
// Test route to verify API is working
app.get('/api/test', (req, res) => {
  console.log('Test route hit!');
  res.json({ message: 'API is working' });
});

console.log('Registering admin routes...');
try {
  app.use('/api/admin', authenticateToken, adminRoutes);
  console.log('Admin routes registered successfully');
} catch (err) {
  console.error('Failed to register admin routes:', err);
}

// 📁 File path helpers
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const upload = multer({ 
  dest: path.join(__dirname, '../uploads'),
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB limit
  }
});
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Until de do better with real labels
app.use('/labels', express.static(path.join(__dirname, '../labels')));

// Demo/sample images for marketing/UX (login hero, etc.)
app.use('/samples', express.static(path.join(__dirname, '../sample_images')));

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

// 🔧 External services
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://ml_service';

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

    const response = await axios.post(`${ML_SERVICE_URL}/ocr`, formData, {
      headers: formData.getHeaders(),
      timeout: 120000  // 2 minute timeout for OCR processing
    });

    res.json({
      ...response.data,
      filename: req.file.filename
    });
  } catch (err) {
    const info = {
      message: err.message,
      code: err.code,
      response_status: err.response?.status,
      response_body: err.response?.data,
    };
    console.error('[OCR Error]', info);
    res.status(502).json({ error: 'ML service unavailable', details: info });
  }
});

// Health check to verify ml_service availability from backend
app.get('/api/ml/health', async (_req, res) => {
  try {
    const r = await axios.get(`${ML_SERVICE_URL}/health`, { timeout: 5000 });
    res.json({ ok: true, url: ML_SERVICE_URL, data: r.data });
  } catch (e) {
    res.status(503).json({ ok: false, url: ML_SERVICE_URL, error: e.message });
  }
});

// 👤 Self profile endpoints
async function ensureUserProfileColumns() {
  try {
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_filename TEXT");
  } catch (e) {
    console.warn('Profile columns ensure failed:', e.message);
  }
}

app.get('/api/me', authenticateToken, async (req, res) => {
  try {
    await ensureUserProfileColumns();
    const r = await pool.query(
      'SELECT id, username, organization_id, display_name, avatar_filename FROM users WHERE id = $1',
      [req.user.id]
    );
    if (r.rowCount === 0) return res.status(404).json({ error: 'User not found' });
    const u = r.rows[0];
    const avatar_url = u.avatar_filename ? `/uploads/${u.avatar_filename}` : null;
    res.json({ ...u, avatar_url });
  } catch (e) {
    console.error('[Get Me Error]', e);
    res.status(500).json({ error: 'Failed to load profile' });
  }
});

app.put('/api/me', authenticateToken, async (req, res) => {
  const { display_name } = req.body;
  try {
    await ensureUserProfileColumns();
    const r = await pool.query(
      'UPDATE users SET display_name = $1 WHERE id = $2 RETURNING id, username, organization_id, display_name, avatar_filename',
      [display_name || null, req.user.id]
    );
    const u = r.rows[0];
    const avatar_url = u.avatar_filename ? `/uploads/${u.avatar_filename}` : null;
    res.json({ ...u, avatar_url });
  } catch (e) {
    console.error('[Update Me Error]', e);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

app.put('/api/me/password', authenticateToken, async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!new_password || new_password.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters' });
  }
  try {
    // Verify current password
    const r = await pool.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'User not found' });
    const ok = await bcrypt.compare(current_password || '', r.rows[0].password);
    if (!ok) return res.status(403).json({ error: 'Current password is incorrect' });

    const hashed = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, req.user.id]);
    res.json({ ok: true });
  } catch (e) {
    console.error('[Password Update Error]', e);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

app.post('/api/me/avatar', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    await ensureUserProfileColumns();
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    await pool.query('UPDATE users SET avatar_filename = $1 WHERE id = $2', [req.file.filename, req.user.id]);
    res.json({ avatar_url: `/uploads/${req.file.filename}` });
  } catch (e) {
    console.error('[Avatar Upload Error]', e);
    res.status(500).json({ error: 'Failed to upload avatar' });
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
  if (embedding.length !== 512) {
    return res.status(400).json({ error: `Embedding must be 512 dimensions, got ${embedding.length}` });
  }

  try {
    await pool.query(
      `INSERT INTO found_items (
        ocr_text, tags, embedding, location, found_at,
        filename, description, description_score, organization_id, submitted_by
      )
      VALUES ($1, $2, $3::vector, $4, $5, $6, $7, $8, $9, $10)`,
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
  let { keyword, startDate, endDate, embedding, semantic } = req.body;

  try {
    const params = [req.user.organization_id];
    let conditions = ['fi.organization_id = $1'];
    let similarityExpr = 'NULL';

    // If semantic text search requested and no embedding provided, try to get a CLIP text embedding
    let createdTextEmbedding = false;
    if (!embedding && semantic && keyword && keyword.trim().length > 0) {
      try {
        const resp = await axios.post(`${ML_SERVICE_URL}/embed_text`, { text: keyword }, { timeout: 15000 });
        if (Array.isArray(resp.data?.embedding) && resp.data.embedding.length === 512) {
          embedding = resp.data.embedding;
          createdTextEmbedding = true;
        }
      } catch (e) {
        console.warn('[Semantic Text Embedding Error]', e?.message || e);
        // Fall back silently to keyword LIKE if embedding fails
      }
    }

    // Only add broad LIKE-based keyword filters when we didn't create a semantic text embedding
    if (keyword && keyword.trim().length > 0 && !createdTextEmbedding) {
      const kw = `%${keyword.trim().toLowerCase()}%`;

      params.push(kw); // ocr_text
      const ocrIdx = params.length;

      params.push(kw); // tags
      const tagsIdx = params.length;

      params.push(kw); // location
      const locIdx = params.length;

      params.push(kw); // owner shipping name
      const ownerNameIdx = params.length;

      params.push(kw); // owner email
      const ownerEmailIdx = params.length;

      params.push(kw); // description
      const descIdx = params.length;

      conditions.push(`(
        LOWER(ocr_text) LIKE $${ocrIdx}
        OR EXISTS (
          SELECT 1 FROM unnest(tags) t WHERE LOWER(t) LIKE $${tagsIdx}
        )
        OR LOWER(location) LIKE $${locIdx}
        OR LOWER(COALESCE(NULLIF(TRIM(c.shipping_address->>'name'), ''), split_part(c.email, '@', 1))) LIKE $${ownerNameIdx}
        OR LOWER(c.email) LIKE $${ownerEmailIdx}
        OR LOWER(description) LIKE $${descIdx}
      )`);
    }

    // In semantic mode, still allow owner name/email to be matched via LIKE
    if (keyword && keyword.trim().length > 0 && createdTextEmbedding) {
      const kw = `%${keyword.trim().toLowerCase()}%`;
      params.push(kw); // owner name
      const ownerNameIdx2 = params.length;
      params.push(kw); // owner email
      const ownerEmailIdx2 = params.length;
      conditions.push(`(
        LOWER(COALESCE(NULLIF(TRIM(c.shipping_address->>'name'), ''), split_part(c.email, '@', 1))) LIKE $${ownerNameIdx2}
        OR LOWER(c.email) LIKE $${ownerEmailIdx2}
      )`);
    }

    if (startDate) {
      // Start of day: YYYY-MM-DD 00:00:00
      params.push(startDate + ' 00:00:00');
      conditions.push(`found_at >= $${params.length}`);
    }

    if (endDate) {
      // End of day: YYYY-MM-DD 23:59:59.999
      params.push(endDate + ' 23:59:59.999');
      conditions.push(`found_at <= $${params.length}`);
    }

    if (embedding && Array.isArray(embedding) && embedding.length === 512) {
      const vectorLiteral = `[${embedding.join(',')}]`;
      params.push(vectorLiteral);
      similarityExpr = `(-(embedding <#> $${params.length}::vector))`;
    }

    const query = `
      SELECT fi.*,
             c.claim_initiated, c.verified, c.shipping_confirmed, c.payment_status, c.shipped,
             CASE WHEN c.verified THEN COALESCE(NULLIF(TRIM(c.shipping_address->>'name'), ''), split_part(c.email, '@', 1)) END AS owner_name,
             ${similarityExpr} AS similarity
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

// Move app.listen to the end after all routes are defined

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

app.post('/api/claims/mark-shipped', authenticateToken, async (req, res) => {
  const { item_id } = req.body;
  if (!item_id) return res.status(400).json({ error: 'Missing item_id' });
  // Assigned a MOCK LABEL for now
  try {
    // Ensure the item belongs to the caller's organization
    const owner = await pool.query('SELECT organization_id FROM found_items WHERE id = $1', [item_id]);
    if (owner.rowCount === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    if (owner.rows[0].organization_id !== req.user.organization_id) {
      return res.status(403).json({ error: 'Forbidden for this organization' });
    }

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

// 📊 Dashboard summary (per-organization)
app.get('/api/dashboard/summary', authenticateToken, async (req, res) => {
  try {
    const orgId = req.user.organization_id;

    const totalItemsQ = pool.query(
      'SELECT COUNT(*)::int AS count FROM found_items WHERE organization_id = $1',
      [orgId]
    );

    const pendingClaimsQ = pool.query(
      `SELECT COUNT(*)::int AS count
       FROM claims c
       JOIN found_items fi ON fi.id = c.item_id
       WHERE fi.organization_id = $1
         AND (c.shipped IS DISTINCT FROM TRUE)`,
      [orgId]
    );

    const returnedItemsQ = pool.query(
      `SELECT COUNT(*)::int AS count
       FROM claims c
       JOIN found_items fi ON fi.id = c.item_id
       WHERE fi.organization_id = $1
         AND c.delivered = TRUE`,
      [orgId]
    );

    const recentItemsQ = pool.query(
      `SELECT id, description, filename, found_at, location
       FROM found_items
       WHERE organization_id = $1
       ORDER BY found_at DESC, id DESC
       LIMIT 3`,
      [orgId]
    );

    const [totalItems, pendingClaims, returnedItems, recentItems] = await Promise.all([
      totalItemsQ, pendingClaimsQ, returnedItemsQ, recentItemsQ
    ]);

    res.json({
      stats: {
        total_items: totalItems.rows[0].count,
        pending_claims: pendingClaims.rows[0].count,
        items_returned: returnedItems.rows[0].count,
      },
      recent_items: recentItems.rows,
    });
  } catch (err) {
    console.error('[Dashboard Summary Error]', err);
    res.status(500).json({ error: 'Failed to load dashboard summary' });
  }
});

// 🔔 Notifications summary (per-organization)
app.get('/api/notifications/summary', authenticateToken, async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    const readyToShipQ = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM claims c
       JOIN found_items fi ON fi.id = c.item_id
       WHERE fi.organization_id = $1
         AND c.verified = TRUE
         AND c.shipping_confirmed = TRUE
         AND c.payment_status = 'paid'
         AND (c.shipped IS DISTINCT FROM TRUE)`,
      [orgId]
    );
    res.json({ ready_to_ship: readyToShipQ.rows[0].count });
  } catch (err) {
    console.error('[Notifications Summary Error]', err);
    res.status(500).json({ error: 'Failed to load notifications' });
  }
});

// 🚀 Start server (moved to end after all routes are defined)
app.listen(3000, () => {
  console.log('✅ Backend running on port 3000');
  console.log('All routes have been registered');
});

// On startup, ensure TestOrg exists and backfill null organization_ids
(async function ensureOrgBackfill() {
  try {
    const orgName = process.env.DEFAULT_ORG_NAME || 'TestOrg';
    const orgRes = await pool.query('INSERT INTO organizations(name) VALUES($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id', [orgName]);
    const orgId = orgRes.rows[0].id;
    const upd = await pool.query('UPDATE found_items SET organization_id = $1 WHERE organization_id IS NULL', [orgId]);
    if (upd.rowCount > 0) {
      console.log(`🔧 Backfilled ${upd.rowCount} items to organization ${orgName} (id=${orgId})`);
    }
  } catch (e) {
    console.warn('Org backfill skipped:', e.message);
  }
})();
