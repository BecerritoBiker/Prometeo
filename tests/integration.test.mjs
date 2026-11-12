import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { setTimeout as sleep } from 'node:timers/promises';

const base = process.env.TEST_BASE_URL ?? 'http://127.0.0.1:8080';
const runId = randomUUID().slice(0, 8);
const makeUser = (role) => ({
  email: `prueba-${role}-${runId}@example.test`,
  full_name: `Cuenta de prueba ${role}`,
  password: randomBytes(24).toString('base64url'),
});

async function call(path, { method = 'GET', body, session, origin } = {}) {
  const response = await fetch(`${base}/api${path}`, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: {
      ...(body !== undefined && { 'Content-Type': 'application/json' }),
      ...(session && { Cookie: session }),
      ...(origin && { Origin: origin }),
    },
    signal: AbortSignal.timeout(8000),
  });
  return {
    status: response.status,
    body: response.status === 204 ? null : await response.json(),
    cookie: response.headers.get('set-cookie'),
  };
}

async function register(user) {
  const response = await call('/auth/register', { method: 'POST', body: user });
  assert.equal(response.status, 201, response.body?.error);
  assert.equal(response.body.user.role, 'user');
  assert.equal(response.body.user.email, user.email);
  assert.match(response.cookie, /HttpOnly/i);
  assert.match(response.cookie, /SameSite=Strict/i);
  return response.cookie.split(';')[0];
}

async function status(path, expected, options) {
  const response = await call(path, options);
  assert.equal(response.status, expected, JSON.stringify(response.body));
  return response.body;
}

function setRole(user, role) {
  const script = ['server/manage-role.mjs', user.email, role];
  if (process.env.TEST_LOCAL_DB === '1') execFileSync(process.execPath, script);
  else execFileSync('docker', ['compose', 'exec', '-T', 'app', 'node', ...script]);
}

async function checkRestart() {
  if (process.env.TEST_COMPOSE_RESTART === '1') {
    execFileSync('docker', ['compose', 'restart'], { timeout: 60000 });
  } else if (process.env.TEST_LOCAL_RESTART_SCRIPT) {
    execFileSync('bash', [process.env.TEST_LOCAL_RESTART_SCRIPT], { timeout: 60000 });
  } else {
    return;
  }
  for (let attempt = 0; attempt < 35; attempt += 1) {
    try {
      if ((await call('/health')).status === 200) return;
    } catch {
      // Durante el reinicio la aplicación puede tardar en aceptar conexiones.
    }
    await sleep(1000);
  }
  assert.fail('El servicio no recuperó su estado saludable tras el reinicio');
}

test('Prometeo: API, roles y persistencia', async (t) => {
  await t.test('La API responde y puede leer PostgreSQL', async () => {
    const health = await status('/health', 200);
    assert.equal(health.status, process.env.TEST_EXPECT_STATUS ?? 'ok');
    await status('/openapi.json', 200);
    await status('/version', 200);
  });
  if (!process.env.TEST_EXPECT_STATUS) {
    await t.test('La portada y la línea base sirven sus activos', async () => {
      for (const query of ['', '?medicion=base']) {
        const index = await fetch(`${base}/${query}`);
        assert.equal(index.status, 200);
        const markup = await index.text();
        const entry = markup.match(/<script[^>]+src="([^"]+)"/)?.[1];
        assert.ok(entry);
        assert.equal(entry.startsWith('/_base/'), Boolean(query));
        assert.equal((await fetch(new URL(entry, base))).status, 200);
      }
    });
    if (process.env.TEST_CACHE === '1') {
      await t.test('Redis reutiliza los indicadores públicos', async () => {
        const health = await status('/health', 200);
        assert.equal(health.cache, 'ready');
        await status('/stats', 200);
        const stats = await fetch(`${base}/api/stats`);
        assert.equal(stats.headers.get('x-prometeo-cache'), 'hit');
      });
    }
  }
  // La demostración de fallo termina antes de crear datos.
  if (process.env.TEST_EXPECT_STATUS) return;

  const citizen = makeUser('ciudadano');
  const second = makeUser('moderador');
  const admin = makeUser('administrador');
  let citizenSession;
  let modSession;
  let adminSession;
  let categoryId;
  let incidentId;
  let anonymousId;

  await t.test('Registro, sesión segura y bloqueo de escrituras de otro origen', async () => {
    await status('/auth/register', 400, { method: 'POST', body: { ...citizen, password: 'corta' } });
    await status('/auth/register', 400, { method: 'POST', body: { ...citizen, role: 'admin' } });
    await status('/auth/register', 403, { method: 'POST', body: citizen, origin: 'https://example.test' });
    citizenSession = await register(citizen);
    modSession = await register(second);
    adminSession = await register(admin);
    await status('/auth/register', 409, { method: 'POST', body: citizen });
    await status('/auth/login', 401, { method: 'POST', body: { email: citizen.email, password: randomUUID() } });
    assert.equal((await status('/auth/session', 200, { session: citizenSession })).user.role, 'user');
    assert.equal((await status('/auth/session', 200)).user, null);
  });

  await t.test('Validación, alta pública, privacidad y consulta de un reporte', async () => {
    const categories = await status('/categories', 200);
    assert.ok(categories.length >= 10);
    categoryId = categories[0].id;
    const report = {
      title: `Incidente de evaluación ${runId}`,
      description: 'Reporte ficticio generado por la prueba de integración de Prometeo.',
      category_id: categoryId, severity: 3, latitude: 5.337891, longitude: -72.395917,
      neighborhood: 'Centro', location_name: 'Referencia que se debe omitir',
    };
    await status('/incidents', 400, { method: 'POST', session: citizenSession, body: { ...report, severity: 8 } });
    await status('/incidents', 400, { method: 'POST', session: citizenSession, body: { ...report, category_id: randomUUID() } });
    await status('/incidents', 401, { method: 'POST', body: report });
    ({ id: incidentId } = await status('/incidents', 201, { method: 'POST', body: report, session: citizenSession }));
    ({ id: anonymousId } = await status('/incidents', 201, { method: 'POST', body: { ...report, is_anonymous: true, consent_updates: true } }));
    const saved = await status(`/incidents/${incidentId}`, 200);
    assert.equal(saved.latitude, 5.338);
    assert.equal(saved.longitude, -72.396);
    assert.equal(saved.location_name, null);
    assert.equal(saved.status, 'nuevo');
    assert.equal('user_id' in saved, false);
    assert.equal('consent_updates' in saved, false);
    const mine = await status('/incidents?scope=mine', 200, { session: citizenSession });
    assert.ok(mine.some((item) => item.id === incidentId));
    assert.ok(!mine.some((item) => item.id === anonymousId));
    const stats = await status('/stats', 200);
    assert.ok(stats.total >= 2);
    assert.ok(stats.by_category.some((item) => item.count >= 2));
  });

  await t.test('Autorización: ciudadano edita el suyo y el moderador registra estados', async () => {
    const path = `/incidents/${incidentId}`;
    const update = { title: `Incidente verificado ${runId}`, description: 'El ciudadano modificó la descripción de su propio reporte.' };
    await status(path, 403, { method: 'PATCH', body: update, session: modSession });
    await status(path, 400, { method: 'PATCH', body: { ...update, status: 'cerrado' }, session: citizenSession });
    await status(path, 204, { method: 'PATCH', body: update, session: citizenSession });
    assert.equal((await status(path, 200)).title, update.title);
    await status(`${path}/updates`, 401, { method: 'POST', body: { status: 'en_verificacion' } });
    await status(`${path}/updates`, 403, { method: 'POST', body: { status: 'en_verificacion' }, session: citizenSession });
    await status('/admin/roles', 403, { method: 'PATCH', body: { email: citizen.email, role: 'admin' }, session: citizenSession });
    setRole(admin, 'admin');
    await status('/admin/roles', 204, { method: 'PATCH', body: { email: second.email, role: 'moderator' }, session: adminSession });
    assert.equal((await status('/auth/session', 200, { session: modSession })).user.role, 'moderator');
    await status(`${path}/updates`, 409, { method: 'POST', body: { status: 'cerrado' }, session: modSession });
    const change = { method: 'POST', body: { status: 'en_verificacion', comment: 'Prueba de verificación', recalibrated_severity: 4 }, session: modSession };
    const concurrent = await Promise.all([call(`${path}/updates`, change), call(`${path}/updates`, change)]);
    assert.deepEqual(concurrent.map(({ status: code }) => code).sort(), [201, 409]);
    await status(`${path}/updates`, 201, { ...change, body: { status: 'remitido' } });
    await status(`${path}/updates`, 201, { ...change, body: { status: 'cerrado' } });
    const closed = await status(path, 200);
    assert.equal(closed.status, 'cerrado');
    assert.equal(closed.recalibrated_severity, 4);
    assert.equal(closed.updates.length, 3);
    assert.ok((await status('/stats', 200)).closed_this_week >= 1);
    await status(path, 403, { method: 'DELETE', session: modSession });
  });

  await t.test('El reporte y su historial siguen disponibles después del reinicio', {
    skip: process.env.TEST_COMPOSE_RESTART !== '1' && !process.env.TEST_LOCAL_RESTART_SCRIPT,
  }, async () => {
    await checkRestart();
    const saved = await status(`/incidents/${incidentId}`, 200);
    assert.equal(saved.status, 'cerrado');
    assert.equal(saved.updates.length, 3);
    assert.equal((await status('/auth/session', 200, { session: modSession })).user.role, 'moderator');
  });

  await t.test('El administrador administra categorías y el cierre revoca la sesión', async () => {
    const category = { name: `Categoría de prueba ${runId}`, description: 'Temporal', color: '#124478' };
    const { id } = await status('/admin/categories', 201, { method: 'POST', body: category, session: adminSession });
    await status(`/admin/categories/${id}`, 204, { method: 'PUT', body: { ...category, description: 'Modificada' }, session: adminSession });
    await status(`/admin/categories/${id}`, 204, { method: 'DELETE', session: adminSession });
    await status(`/admin/categories/${categoryId}`, 409, { method: 'DELETE', session: adminSession });
    await status(`/incidents/${incidentId}`, 204, { method: 'DELETE', session: adminSession });
    await status(`/incidents/${anonymousId}`, 204, { method: 'DELETE', session: adminSession });
    await status(`/incidents/${incidentId}`, 404);
    await status('/auth/logout', 204, { method: 'POST', session: citizenSession });
    assert.equal((await status('/auth/session', 200, { session: citizenSession })).user, null);
    const newLogin = await call('/auth/login', { method: 'POST', body: { email: citizen.email, password: citizen.password } });
    assert.equal(newLogin.status, 200);
    assert.notEqual(newLogin.cookie.split(';')[0], citizenSession);
  });
});
