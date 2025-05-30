import express from 'express';
import Stripe from 'stripe';
import pkg from 'pg';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const router = express.Router();

const { Pool } = pkg;
const pool = new Pool({
  user: process.env.POSTGRES_USER || 'user',
  host: process.env.POSTGRES_HOST || 'db',
  database: process.env.POSTGRES_DB || 'mydb',
  password: process.env.POSTGRES_PASSWORD || 'password',
  port: 5432
});

// POST /api/payment/confirm
router.post('/confirm', async (req, res) => {

  const { session_id } = req.body;

  if (!session_id) {
    return res.status(400).json({ error: 'Missing session_id' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);

    const item_id = session.metadata?.item_id;
    const payment_status = session.payment_status;

    if (!item_id) {
      return res.status(400).json({ error: 'Missing item_id in Stripe metadata' });
    }

    await pool.query(
      `UPDATE claims
       SET payment_status = $1,
           payment_session_id = $2
       WHERE item_id = $3`,
      [payment_status, session_id, item_id]
    );

    res.json({ message: 'Payment confirmed and saved.' });
  } catch (err) {
    console.error('[Payment Confirm Error]', err);
    res.status(500).json({ error: 'Could not confirm payment' });
  }
});

export default router;