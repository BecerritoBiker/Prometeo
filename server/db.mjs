import { readFile, readdir } from 'node:fs/promises';
import pg from 'pg';

const { Pool } = pg;

export async function openDatabase() {
  const { DATABASE_URL, DB_HOST, DB_NAME, DB_USER, DB_PASSWORD_FILE, DB_PORT } = process.env;
  if (!DATABASE_URL && (!DB_HOST || !DB_NAME || !DB_USER || !DB_PASSWORD_FILE)) {
    throw new Error('Falta configurar la conexión a PostgreSQL');
  }
  const connection = DATABASE_URL
    ? { connectionString: DATABASE_URL }
    : {
        host: DB_HOST,
        port: DB_PORT ? Number(DB_PORT) : 5432,
        database: DB_NAME,
        user: DB_USER,
        password: (await readFile(DB_PASSWORD_FILE, 'utf8')).trim(),
      };
  const db = new Pool({
    ...connection,
    max: 8,
    options: '-c timezone=America/Bogota',
    connectionTimeoutMillis: 3000,
    statement_timeout: 4000,
    idle_in_transaction_session_timeout: 10000,
  });
  db.on('error', (error) => console.error('Conexión inactiva de PostgreSQL interrumpida', error.code));
  return db;
}

export async function transaction(db, callback) {
  const connection = await db.connect();
  try {
    await connection.query('BEGIN');
    const result = await callback(connection);
    await connection.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await connection.query('ROLLBACK');
    } catch {
      // La conexión puede haberse cerrado durante el fallo original.
    }
    throw error;
  } finally {
    connection.release();
  }
}

export async function migrate(db) {
  const directory = new URL('../db/migrations/', import.meta.url);
  const migrations = (await readdir(directory)).filter((name) => name.endsWith('.sql')).sort();
  await transaction(db, async (connection) => {
    await connection.query('SELECT pg_advisory_xact_lock(736112)');
    await connection.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY)');
    const { rows } = await connection.query('SELECT name FROM schema_migrations');
    const applied = new Set(rows.map(({ name }) => name));
    for (const name of migrations) {
      if (applied.has(name)) continue;
      await connection.query(await readFile(new URL(name, directory), 'utf8'));
      await connection.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name]);
      console.info('Migración aplicada', name);
    }
  });
}
