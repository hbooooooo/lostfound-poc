// docker compose run --rm backend node scripts/create-user.mjs
// docker compose down -v  # Removes containers + volumes
// docker compose up --build -d


import bcrypt from 'bcrypt';
import pkg from 'pg';

const { Pool } = pkg;

const pool = new Pool({
  user: 'user',
  host: 'db',
  database: 'mydb',
  password: 'password',
  port: 5432
});

// Customize:
const username = 'admin';
const password = 'changeme';
const orgName = 'TestOrg';

const run = async () => {
  const hashed = await bcrypt.hash(password, 10);

  let org = await pool.query('SELECT id FROM organizations WHERE name = $1', [orgName]);
  let orgId = org.rows.length
    ? org.rows[0].id
    : (await pool.query(
        'INSERT INTO organizations(name) VALUES ($1) RETURNING id',
        [orgName]
      )).rows[0].id;

  await pool.query(`
    INSERT INTO users (username, password, organization_id)
    VALUES ($1, $2, $3) ON CONFLICT (username) DO NOTHING
  `, [username, hashed, orgId]);

  console.log('✅ User created!');
  process.exit();
};

run();
