import express from 'express';
import jwt from 'jsonwebtoken';
import pkg from 'pg';

const { Pool } = pkg;
const pool = new Pool({
  user: process.env.POSTGRES_USER || 'user',
  host: process.env.POSTGRES_HOST || 'db',
  database: process.env.POSTGRES_DB || 'mydb',
  password: process.env.POSTGRES_PASSWORD || 'password',
  port: 5432
});

const router = express.Router();

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

// GET /api/claims/activity
router.get('/claims/activity', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.email, c.verified, c.created_at,
              fi.description, fi.filename, fi.found_at
       FROM claims c
       JOIN found_items fi ON c.item_id = fi.id
       WHERE c.verified = TRUE 
         AND (c.shipped IS NULL OR c.shipped = FALSE)
         AND fi.organization_id = $1
       ORDER BY c.created_at DESC`,
      [req.user.organization_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[Activity Fetch Error]', err);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

// POST /api/claims/:id/approve
router.post('/claims/:id/approve', async (req, res) => {
  const claimId = req.params.id;
  try {
    await pool.query(
      `UPDATE claims SET shipped = TRUE WHERE id = $1`,
      [claimId]
    );
    res.json({ message: 'Claim approved for shipment' });
  } catch (err) {
    console.error('[Approval Error]', err);
    res.status(500).json({ error: 'Failed to approve claim' });
  }
});

export default router;
