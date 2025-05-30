import express from 'express';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const router = express.Router();

router.post('/session', async (req, res) => {
  const { email, amount, item_id, shipping_label } = req.body;

  if (!email || !amount || !item_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const publicUrl = process.env.APP_PUBLIC_URL || 'http://localhost:5173';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email,
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Return shipping: ${shipping_label}`,
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }],
      success_url: `${publicUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${publicUrl}/payment-cancelled`,
      metadata: {
        item_id,
        shipping_label
      }
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('[Stripe Session Error]', err);
    res.status(500).json({ error: 'Failed to create Stripe session' });
  }
});

export default router;