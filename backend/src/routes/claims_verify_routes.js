import express from 'express';
import pkg from 'pg';
import dayjs from 'dayjs';

const { Pool } = pkg;
const pool = new Pool({
  user: process.env.POSTGRES_USER || 'user',
  host: process.env.POSTGRES_HOST || 'db',
  database: process.env.POSTGRES_DB || 'mydb',
  password: process.env.POSTGRES_PASSWORD || 'password',
  port: process.env.POSTGRES_PORT || 5432
});

const router = express.Router();

// GET /api/claims/verify?token=abc123
router.get('/verify', async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Missing token' });
  }

  try {
    const result = await pool.query(
      `SELECT claims.id AS claim_id, claims.email, claims.token_expires, claims.verified,
              found_items.id AS item_id, found_items.description, found_items.filename
       FROM claims
       JOIN found_items ON claims.item_id = found_items.id
       WHERE claims.token = $1`,
      [token]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Invalid token' });
    }

    const claim = result.rows[0];
    const now = dayjs();

    if (now.isAfter(dayjs(claim.token_expires))) {
      return res.status(403).json({ error: 'Token expired' });
    }

    return res.json({ claim });
  } catch (err) {
    console.error('GET /verify error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/claims/verify
router.post('/verify', async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Missing token' });
  }

  try {
    const result = await pool.query(
      `UPDATE claims
       SET verified = TRUE
       WHERE token = $1
       AND token_expires > NOW()
       RETURNING id`,
      [token]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    return res.json({ message: 'Ownership verified' });
  } catch (err) {
    console.error('POST /verify error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;