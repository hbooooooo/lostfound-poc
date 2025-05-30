// run with
// docker compose run --rm backend node scripts/db_script.mjs
//
// maually
// docker compose exec db psql -U user -d mydb


import pkg from 'pg';

const { Pool } = pkg;

const pool = new Pool({
  user: 'user',
  host: 'db',
  database: 'mydb',
  password: 'password',
  port: 5432
});

const run = async () => {

  await pool.query(`
  ALTER TABLE claims
  ADD COLUMN IF NOT EXISTS shipped BOOLEAN DEFAULT FALSE;
    `);

  console.log('✅ DB updated!');

  await pool.query(
    `
    SELECT item_id, shipping_label, shipped FROM claims WHERE shipping_label IS NOT NULL;
`);

  process.exit();
};

run();