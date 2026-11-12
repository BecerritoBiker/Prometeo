import { openDatabase } from './db.mjs';
import { email, role, validate } from './validation.mjs';

let db;
try {
  const [rawEmail, rawRole] = process.argv.slice(2);
  const address = validate(email, rawEmail);
  const newRole = validate(role, rawRole);
  db = await openDatabase();
  const result = await db.query('UPDATE users SET role = $1 WHERE email = $2', [newRole, address]);
  if (!result.rowCount) throw new Error('Registra la cuenta antes de asignar el rol');
  console.log(`Rol asignado: ${newRole}`);
} catch (error) {
  console.error(error.code ? 'No se pudo guardar el rol en PostgreSQL' : error.message);
  process.exitCode = 1;
} finally {
  if (db) await db.end();
}
