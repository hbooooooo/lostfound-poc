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
CREATE TABLE IF NOT EXISTS tag_vocabulary (
  id SERIAL PRIMARY KEY,
  label TEXT NOT NULL UNIQUE,
  lang TEXT DEFAULT 'en'
);
    `);

  console.log('✅ DB updated!');

  process.exit();
};

run();