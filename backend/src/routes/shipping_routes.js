import express from 'express';
import pool from '../db.js';

const router = express.Router();

// POST /api/shipping/rates - Calculate shipping rates
router.post('/shipping/rates', async (req, res) => {
  const { token, shipping_address } = req.body;

  if (!token || !shipping_address) {
    return res.status(400).json({ error: 'Token and shipping address are required' });
  }

  try {
    // Verify claim exists and get organization
    const claimResult = await pool.query(`
      SELECT c.*, fi.organization_id, o.origin_address, o.name as organization_name
      FROM claims c
      JOIN found_items fi ON fi.id = c.item_id
      JOIN organizations o ON o.id = fi.organization_id
      WHERE c.token = $1
    `, [token]);

    if (claimResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid token' });
    }

    const claim = claimResult.rows[0];
    const originAddress = claim.origin_address;
    const destinationAddress = shipping_address;

    // Simulate shipping rate calculation based on distance/zones
    const shippingRates = calculateFakeShippingRates(originAddress, destinationAddress);

    res.json({
      rates: shippingRates,
      origin: {
        organization: claim.organization_name,
        address: originAddress
      },
      destination: destinationAddress
    });
  } catch (err) {
    console.error('[Shipping Rates Error]', err);
    res.status(500).json({ error: 'Failed to calculate shipping rates' });
  }
});

// Fake shipping rate calculation
function calculateFakeShippingRates(origin, destination) {
  // Base rates
  let baseStandard = 8.99;
  let baseExpress = 16.99;
  let baseOvernight = 28.99;

  // Calculate "distance" multiplier based on country difference
  let distanceMultiplier = 1.0;
  
  if (origin?.country && destination?.country) {
    if (origin.country !== destination.country) {
      // International shipping
      distanceMultiplier = 2.5;
    } else {
      // Domestic shipping - vary by postal code difference (fake calculation)
      const originPostal = origin.postalCode || '00000';
      const destPostal = destination.postalCode || '00000';
      const postalDiff = Math.abs(parseInt(originPostal.substring(0, 2)) - parseInt(destPostal.substring(0, 2)));
      distanceMultiplier = 1 + (postalDiff * 0.1); // 10% per postal zone difference
    }
  }

  // Add some randomness to make it feel more realistic
  const randomFactor = 0.9 + (Math.random() * 0.2); // ±10% variance

  return [
    {
      id: 'standard',
      label: 'Standard Shipping',
      description: origin?.country !== destination?.country ? '7-14 business days' : '5-7 business days',
      price: Math.round((baseStandard * distanceMultiplier * randomFactor) * 100) / 100,
      carrier: 'Standard Post',
      estimated_days: origin?.country !== destination?.country ? '7-14' : '5-7'
    },
    {
      id: 'express',
      label: 'Express Shipping',
      description: origin?.country !== destination?.country ? '3-5 business days' : '2-3 business days',
      price: Math.round((baseExpress * distanceMultiplier * randomFactor) * 100) / 100,
      carrier: 'Express Courier',
      estimated_days: origin?.country !== destination?.country ? '3-5' : '2-3'
    },
    {
      id: 'overnight',
      label: 'Priority Overnight',
      description: origin?.country !== destination?.country ? 'Not available' : 'Next business day',
      price: origin?.country !== destination?.country ? null : Math.round((baseOvernight * distanceMultiplier * randomFactor) * 100) / 100,
      carrier: 'Priority Express',
      estimated_days: '1',
      available: origin?.country === destination?.country
    }
  ].filter(rate => rate.available !== false); // Remove unavailable rates
}

export default router;