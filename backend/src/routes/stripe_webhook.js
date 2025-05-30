import express from 'express';
import Stripe from 'stripe';
import pkg from 'pg';
import bodyParser from 'body-parser';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

const { Pool } = pkg;
const pool = new Pool({
  user: process.env.POSTGRES_USER || 'user',
  host: process.env.POSTGRES_HOST || 'db',
  database: process.env.POSTGRES_DB || 'mydb',
  password: process.env.POSTGRES_PASSWORD || 'password',
  port: process.env.POSTGRES_PORT || 5432
});

// Stripe webhook must use raw body
router.post('/payment/webhook', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('[Webhook Error]', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const itemId = session.metadata?.item_id;

    if (itemId) {
      try {
        await pool.query(
          `UPDATE claims SET verified = TRUE
           WHERE item_id = $1`,
          [itemId]
        );
        console.log(`[Webhook] Marked claim for item ${itemId} as paid/verified.`);
      } catch (err) {
        console.error('[Webhook DB Error]', err);
      }
    }
  }

  res.json({ received: true });
});

export default router;