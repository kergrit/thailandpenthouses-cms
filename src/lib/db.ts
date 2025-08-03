import { Pool } from 'pg';

let pool: Pool;

if (process.env.NODE_ENV === 'production') {
  // Production: Use Cloud SQL Unix socket
  pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: `/cloudsql/${process.env.CLOUD_SQL_CONNECTION_NAME}`,
  });
} else {
  // Development: Use Cloud SQL Proxy (TCP)
  pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 5432,
  });
}

export default pool;
