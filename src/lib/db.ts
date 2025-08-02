import { Pool } from 'pg';

const gcpConfig = {
  keyFilename: process.env.NODE_ENV !== 'production' ? 'service-account-key.json' : undefined,
};

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
    // Note: 'pg' library doesn't use gcpConfig directly for auth like @google-cloud libraries,
    // but Cloud SQL Proxy relies on Application Default Credentials which we've set.
    // This structure prepares for potential future GCP integrations in this file.
  });
}

export default pool;
