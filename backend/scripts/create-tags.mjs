// docker compose run --rm backend node scripts/create-tags.mjs
// check with curl http://localhost:3000/api/tags/vocabulary

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
    INSERT INTO tag_vocabulary (label) VALUES
    ('wallet'),
    ('backpack'),
    ('passport'),
    ('keys'),
    ('luggage'),
    ('sunglasses'),
    ('phone'),
    ('jacket'),
    ('credit card'),
    ('book');
    `);

  console.log('✅ Tags created!');
  process.exit();
};

run();