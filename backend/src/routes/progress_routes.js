import express from 'express';
import pkg from 'pg';
import dayjs from 'dayjs';

const { Pool } = pkg;
const pool = new Pool({
  user: process.env.POSTGRES_USER || 'user',
  host: process.env.POSTGRES_HOST || 'db',
  database: process.env.POSTGRES_DB || 'mydb',
  password: process.env.POSTGRES_PASSWORD || 'password',
  port: 5432
});

const router = express.Router();

// POST /api/claims/progress
router.post('/claims/progress', async (req, res) => {
  const { token, shipping_label, shipping_address, tc_agreed } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Missing token' });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM claims WHERE token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid token' });
    }

    const claim = result.rows[0];
    const now = dayjs();

    if (now.isAfter(claim.token_expires)) {
      return res.status(403).json({ error: 'Token expired' });
    }

    await pool.query(
      `UPDATE claims SET
        shipping_label = COALESCE($1, shipping_label),
        shipping_address = COALESCE($2, shipping_address),
        tc_agreed = COALESCE($3, tc_agreed),
        shipping_confirmed = TRUE
      WHERE token = $4`,
      [shipping_label, shipping_address, tc_agreed, token]
    );

    res.json({ message: 'Progress saved' });
  } catch (err) {
    console.error('[Claim Progress Error]', err);
    res.status(500).json({ error: 'Failed to save progress' });
  }
});

export default router;