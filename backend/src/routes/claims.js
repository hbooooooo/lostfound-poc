import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import dayjs from 'dayjs';
import fs from 'fs/promises';
import path from 'path';
import pkg from 'pg';

const { Pool } = pkg;
const pool = new Pool({
  user: process.env.POSTGRES_USER || 'user',
  host: process.env.POSTGRES_HOST || 'db',
  database: process.env.POSTGRES_DB || 'mydb',
  password: process.env.POSTGRES_PASSWORD || 'password',
  port: process.env.POSTGRES_PORT || 5432
});

const router = express.Router();

async function loadTemplate(lang = 'en') {
  const filePath = path.resolve('/app/templates', `claim-init.${lang}.txt`);
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    const lines = raw.split('\n');
    const subjectLine = lines.find(line => line.toLowerCase().startsWith('subject:'));
    const subject = subjectLine ? subjectLine.replace(/^subject:/i, '').trim() : 'Lost & Found Claim';
    const body = lines.filter(line => !line.toLowerCase().startsWith('subject:')).join('\n');
    return { subject, body };
  } catch (err) {
    console.error('[Template Error]', err);
    return { subject: 'Lost & Found Claim', body: 'Click the link: {{ link }}' };
  }
}

// Minimal JWT auth for this router
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

router.post('/initiate', authenticateToken, async (req, res) => {
  const { item_id, email, lang, length_cm, width_cm, height_cm, weight_kg, is_document } = req.body;

  if (!item_id || !email) {
    return res.status(400).json({ error: 'Missing item_id or email' });
  }

  // Enforce package requirements: either 4 dimensions (incl. weight) or document flag + weight
  const isNum = (v) => typeof v === 'number' && !Number.isNaN(v) && v > 0;
  if (is_document === true) {
    if (!isNum(weight_kg)) {
      return res.status(400).json({ error: 'Weight (kg) is required and must be > 0 for document shipments' });
    }
  } else {
    if (!(isNum(length_cm) && isNum(width_cm) && isNum(height_cm) && isNum(weight_kg))) {
      return res.status(400).json({ error: 'Please provide length_cm, width_cm, height_cm and weight_kg (all > 0), or set is_document=true with weight_kg' });
    }
  }

  const token = crypto.randomUUID();
  const expires = dayjs().add(1, 'day').toISOString();
  const baseUrl = process.env.APP_PUBLIC_URL || 'http://localhost:5173';
  const link = `${baseUrl}/verify-claim?token=${token}`;

  try {
    // Ensure item belongs to the same organization
    const check = await pool.query(
      'SELECT 1 FROM found_items WHERE id = $1 AND organization_id = $2',
      [item_id, req.user.organization_id]
    );
    if (check.rowCount === 0) {
      return res.status(403).json({ error: 'Item does not belong to your organization' });
    }
    // Optionally update item shipping estimates
    if (item_id && (length_cm || width_cm || height_cm || weight_kg || typeof is_document === 'boolean')) {
      const updates = [];
      const params = [];
      let idx = 1;
      if (typeof length_cm === 'number') { updates.push(`length_cm = $${idx++}`); params.push(length_cm); }
      if (typeof width_cm === 'number') { updates.push(`width_cm = $${idx++}`); params.push(width_cm); }
      if (typeof height_cm === 'number') { updates.push(`height_cm = $${idx++}`); params.push(height_cm); }
      if (typeof weight_kg === 'number') { updates.push(`weight_kg = $${idx++}`); params.push(weight_kg); }
      if (typeof is_document === 'boolean') {
        updates.push(`is_document = $${idx++}`); params.push(is_document);
        if (is_document === true) {
          // Explicitly clear dimensions for document shipments
          updates.push(`length_cm = NULL`, `width_cm = NULL`, `height_cm = NULL`);
        }
      }
      if (updates.length) {
        params.push(item_id, req.user.organization_id);
        await pool.query(
          `UPDATE found_items SET ${updates.join(', ')} WHERE id = $${idx++} AND organization_id = $${idx} `,
          params
        );
      }
    }

    await pool.query(
      `INSERT INTO claims (item_id, email, token, token_expires, claim_initiated)
       VALUES ($1, $2, $3, $4, true)`,
      [item_id, email, token, expires]
    );

    const { subject, body } = await loadTemplate(lang || 'en');
    const filledBody = body.replace('{{ link }}', link);

    // Replace this with your real email sender later
    console.log(`[EMAIL MOCK] To: ${email}`);
    console.log(`Subject: ${subject}`);
    console.log(filledBody);

    res.json({ message: 'Claim link sent', link });
  } catch (err) {
    console.error('[Claim Error]', err);
    res.status(500).json({ error: 'Failed to initiate claim' });
  }
});

export default router;
