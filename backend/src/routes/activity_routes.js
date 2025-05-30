import express from 'express';
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

// GET /api/claims/activity
router.get('/claims/activity', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT claims.id, claims.email, claims.verified, claims.created_at,
              found_items.description, found_items.filename, found_items.found_at
       FROM claims
       JOIN found_items ON claims.item_id = found_items.id
       WHERE claims.verified = TRUE AND (claims.shipped IS NULL OR claims.shipped = FALSE)
       ORDER BY claims.created_at DESC`
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