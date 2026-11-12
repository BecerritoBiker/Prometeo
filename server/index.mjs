import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import compression from 'compression';
import express from 'express';
import helmet from 'helmet';
import { parse } from 'yaml';
import { openStatsCache } from './cache.mjs';
import { bootstrapAdmin, installAuth } from './auth.mjs';
import { migrate, openDatabase } from './db.mjs';
import { installIncidents } from './incidents.mjs';
import { HttpError } from './validation.mjs';

const port = Number(process.env.PORT ?? 8080);
const secure = process.env.COOKIE_SECURE === 'true';
const proxyHops = Number(process.env.TRUST_PROXY ?? 0);
const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const baseline = fileURLToPath(new URL('../dist-baseline/', import.meta.url));
const apiFile = fileURLToPath(new URL('../api/openapi.yaml', import.meta.url));
const packageFile = new URL('../package.json', import.meta.url);

async function start() {
  const [apiSpec, metadata] = await Promise.all([
    readFile(apiFile, 'utf8').then(parse),
    readFile(packageFile, 'utf8').then(JSON.parse),
  ]);
  const db = await openDatabase();
  try {
    await migrate(db);
    await bootstrapAdmin(db);
  } catch (error) {
    await db.end();
    throw error;
  }

  const cache = openStatsCache();
  const app = express();
  app.disable('x-powered-by');
  if (proxyHops > 0) app.set('trust proxy', proxyHops);
  app.use(helmet({
    strictTransportSecurity: secure ? undefined : false,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    contentSecurityPolicy: {
      directives: {
        imgSrc: ["'self'", 'data:', 'https://tile.openstreetmap.org'],
        upgradeInsecureRequests: secure ? [] : null,
      },
    },
  }));
  app.use(compression());
  app.get('/api/health', async (_req, res) => {
    res.set('Cache-Control', 'no-store');
    try {
      await db.query('SELECT 1 FROM schema_migrations LIMIT 1');
      res.json({ status: 'ok', cache: cache.status() });
    } catch {
      res.status(503).json({ status: 'unavailable' });
    }
  });
  app.get('/api/openapi.json', (_req, res) => res.json(apiSpec));
  app.get('/api/openapi.yaml', (_req, res) => res.type('text/yaml').sendFile(apiFile));
  app.get('/api/version', (_req, res) => res.set('Cache-Control', 'no-store').json({
    version: metadata.version, revision: process.env.RENDER_GIT_COMMIT ?? null,
  }));

  const api = express.Router();
  api.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    const safe = ['GET', 'HEAD', 'OPTIONS'].includes(req.method);
    const origin = req.get('origin');
    const expected = `${secure ? 'https' : req.protocol}://${req.get('host')}`;
    if (!safe && (req.get('sec-fetch-site') === 'cross-site' || (origin && origin !== expected))) {
      return next(new HttpError(403, 'La solicitud debe provenir de Prometeo'));
    }
    next();
  });
  api.use(express.json({ limit: '16kb' }));
  installAuth(api, db, secure);
  installIncidents(api, db, cache);
  api.use((_req, _res, next) => next(new HttpError(404, 'La ruta de la API no existe')));
  app.use('/api', api);

  app.use('/_base/assets', express.static(`${baseline}assets`, { immutable: true, maxAge: '1y' }));
  app.use('/_base', express.static(baseline, { index: false }));
  app.get('/', (req, res, next) => {
    if (req.query.medicion === 'base') return res.sendFile(`${baseline}index.html`, { maxAge: 0 });
    next();
  });
  app.use('/assets', express.static(`${dist}assets`, { immutable: true, maxAge: '1y' }));
  app.use(express.static(dist, { index: false }));
  app.get(/.*/, (_req, res) => res.sendFile(`${dist}index.html`, { maxAge: 0 }));

  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (error instanceof HttpError) return res.status(error.status).json({ error: error.message });
    if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'Envía JSON válido' });
    if (error.type === 'entity.too.large') return res.status(413).json({ error: 'La solicitud es demasiado grande' });
    if (error.code === '23505') return res.status(409).json({ error: 'Ya existe un registro con esos datos' });
    if (error.code === '23503') {
      const deleting = req.method === 'DELETE';
      return res.status(deleting ? 409 : 400).json({
        error: deleting ? 'La categoría todavía tiene reportes asociados' : 'La categoría seleccionada no existe',
      });
    }
    console.error('Error al procesar solicitud', req.method, error.code ?? error.name);
    if (['ECONNREFUSED', 'ECONNRESET', '57P01', '57014', 'ETIMEDOUT'].includes(error.code)
        || /timeout|connection terminated/i.test(error.message)) {
      return res.status(503).json({ error: 'Servicio temporalmente no disponible. Intenta de nuevo.' });
    }
    res.status(500).json({ error: 'No pudimos completar la operación. Intenta de nuevo.' });
  });

  const server = app.listen(port, '0.0.0.0', () => console.info(`Prometeo escucha en el puerto ${port}`));
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, () => server.close(async () => {
      cache.close();
      await db.end();
      process.exit(0);
    }));
  }
}

start().catch((error) => {
  console.error('No se pudo iniciar Prometeo', error.code ?? error.message);
  process.exitCode = 1;
});
