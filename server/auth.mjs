import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { parseCookie } from 'cookie';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { transaction } from './db.mjs';
import { account, email, HttpError, validate } from './validation.mjs';

const deriveKey = promisify(scrypt);
const scryptOptions = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };
const sessionLength = 7 * 24 * 60 * 60 * 1000;
const dummyPassword = hashPassword(randomBytes(32).toString('hex'));

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await deriveKey(password, salt, 64, scryptOptions);
  return `scrypt$1$${salt.toString('hex')}$${hash.toString('hex')}`;
}

async function verifyPassword(password, stored) {
  const [, , salt, expected] = stored.split('$');
  const hash = await deriveKey(password, Buffer.from(salt, 'hex'), 64, scryptOptions);
  return timingSafeEqual(hash, Buffer.from(expected, 'hex'));
}

const tokenHash = (value) => createHash('sha256').update(value).digest('hex');

function getSessionHash(req, cookieName) {
  const token = parseCookie(req.headers.cookie ?? '')[cookieName];
  return typeof token === 'string' && /^[0-9a-f]{64}$/.test(token) ? tokenHash(token) : null;
}

export const limit = (max, windowMs) => rateLimit({
  limit: max, windowMs, standardHeaders: 'draft-7', legacyHeaders: false,
  message: { error: 'Demasiados intentos. Vuelve a intentarlo más tarde.' },
});

export function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(new HttpError(401, 'Inicia sesión para continuar'));
    if (roles.length && !roles.includes(req.user.role)) {
      return next(new HttpError(403, 'Tu cuenta no tiene permiso para realizar esta operación'));
    }
    next();
  };
}

export async function bootstrapAdmin(db) {
  const { BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_PASSWORD } = process.env;
  if (!BOOTSTRAP_ADMIN_EMAIL && !BOOTSTRAP_ADMIN_PASSWORD) return;
  const input = validate(account, {
    email: BOOTSTRAP_ADMIN_EMAIL, password: BOOTSTRAP_ADMIN_PASSWORD, full_name: 'Administración Prometeo',
  });
  const { rows: [existing] } = await db.query('SELECT role FROM users WHERE email = $1', [input.email]);
  if (existing?.role === 'admin') return;
  if (existing) throw new Error('El correo de inicialización ya pertenece a una cuenta sin rol administrador');
  const hash = await hashPassword(input.password);
  await db.query(
    "INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, 'admin') ON CONFLICT (email) DO NOTHING",
    [input.email, hash, input.full_name],
  );
  const { rows: [created] } = await db.query('SELECT role FROM users WHERE email = $1', [input.email]);
  if (created?.role !== 'admin') throw new Error('La cuenta de inicialización no pudo crearse como administradora');
}

export function installAuth(api, db, secure) {
  const cookieName = secure ? '__Host-prometeo_session' : 'prometeo_session';
  const cookieOptions = { httpOnly: true, secure, sameSite: 'strict', path: '/' };

  async function storeSession(connection, req, user) {
    const value = randomBytes(32).toString('hex');
    await connection.query('DELETE FROM sessions WHERE expires_at <= now() OR token_hash = $1', [
      req.sessionHash,
    ]);
    await connection.query(
      "INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, now() + interval '7 days')",
      [tokenHash(value), user.id],
    );
    return value;
  }

  function setSessionCookie(res, value) {
    res.cookie(cookieName, value, { ...cookieOptions, maxAge: sessionLength });
  }

  api.use(async (req, _res, next) => {
    req.sessionHash = getSessionHash(req, cookieName);
    req.user = null;
    if (req.sessionHash) {
      const { rows } = await db.query(
        `SELECT u.id, u.email, u.full_name, u.role
         FROM sessions s JOIN users u ON u.id = s.user_id
         WHERE s.token_hash = $1 AND s.expires_at > now()`,
        [req.sessionHash],
      );
      req.user = rows[0] ?? null;
    }
    next();
  });

  api.get('/auth/session', (req, res) => res.json({ user: req.user }));

  api.post('/auth/register', limit(8, 900000), async (req, res) => {
    const input = validate(account, req.body);
    const hash = await hashPassword(input.password);
    const { user, value } = await transaction(db, async (connection) => {
      const { rows: [created] } = await connection.query(
        `INSERT INTO users (email, full_name, password_hash) VALUES ($1, $2, $3)
         ON CONFLICT (email) DO NOTHING RETURNING id, email, full_name, role`,
        [input.email, input.full_name, hash],
      );
      if (!created) throw new HttpError(409, 'El correo ya está registrado');
      return { user: created, value: await storeSession(connection, req, created) };
    });
    setSessionCookie(res, value);
    res.status(201).json({ user });
  });

  api.post('/auth/login', limit(15, 900000), async (req, res) => {
    const input = validate(z.strictObject({
      email, password: z.string().min(1).max(128),
    }), req.body);
    const { rows: [record] } = await db.query(
      'SELECT id, email, full_name, role, password_hash FROM users WHERE email = $1',
      [input.email],
    );
    const valid = await verifyPassword(input.password, record?.password_hash ?? await dummyPassword);
    if (!record || !valid) throw new HttpError(401, 'Correo o contraseña incorrectos');
    const { password_hash: _hash, ...user } = record;
    const value = await transaction(db, (connection) => storeSession(connection, req, user));
    setSessionCookie(res, value);
    res.json({ user });
  });

  api.post('/auth/logout', async (req, res) => {
    if (req.sessionHash) await db.query('DELETE FROM sessions WHERE token_hash = $1', [req.sessionHash]);
    res.clearCookie(cookieName, cookieOptions).status(204).end();
  });
}
