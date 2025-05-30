import express from 'express';
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

router.post('/initiate', async (req, res) => {
  const { item_id, email, lang } = req.body;

  if (!item_id || !email) {
    return res.status(400).json({ error: 'Missing item_id or email' });
  }

  const token = crypto.randomUUID();
  const expires = dayjs().add(1, 'day').toISOString();
  const baseUrl = process.env.APP_PUBLIC_URL || 'http://localhost:5173';
  const link = `${baseUrl}/verify-claim?token=${token}`;

  try {
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