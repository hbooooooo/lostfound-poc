import express from 'express';
import path from 'path';
import fs from 'fs/promises';
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

// GET /api/items/:id
router.get('/items/:id', async (req, res) => {
  const itemId = req.params.id;

  try {
    const result = await pool.query(
      `SELECT * FROM found_items WHERE id = $1`,
      [itemId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('[Fetch Item Error]', err);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

// GET /api/templates/claim-init?lang=en
router.get('/templates/claim-init', async (req, res) => {
  const lang = req.query.lang || 'en';
  const filePath = path.resolve('/app/templates', `claim-init.${lang}.txt`);

  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    const lines = raw.split('\n');
    const subjectLine = lines.find(line => line.toLowerCase().startsWith('subject:'));
    const subject = subjectLine ? subjectLine.replace(/^subject:/i, '').trim() : 'Lost & Found Claim';
    const body = lines.filter(line => !line.toLowerCase().startsWith('subject:')).join('\n');
    res.json({ subject, body });
  } catch (err) {
    console.error('[Template Load Error]', err);
    res.status(500).json({ error: 'Template not found' });
  }
});

export default router;