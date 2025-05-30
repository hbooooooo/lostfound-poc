import pkg from 'pg';

const { Pool } = pkg;

// Shared database connection pool
const pool = new Pool({
  user: 'user',
  host: 'db', 
  database: 'mydb',
  password: 'password',
  port: 5432
});

export default pool;