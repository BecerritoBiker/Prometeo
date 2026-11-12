import { z } from 'zod';
import { authorize, limit } from './auth.mjs';
import { transaction } from './db.mjs';
import {
  category, editIncident, email, HttpError, incidentUpdate, newIncident, role, statuses, uuid, validate,
} from './validation.mjs';

const publicFields = `i.id, i.category_id, i.title, i.description, i.subcategory,
  i.severity, i.recalibrated_severity, i.status, i.latitude, i.longitude,
  i.location_name, i.neighborhood, i.is_anonymous, i.is_precise_location,
  i.created_at, i.updated_at, i.resolved_at`;

const statsQuery = `
WITH month_counts AS (
  SELECT to_char(month, 'YYYY-MM') AS month,
    (SELECT count(*)::int FROM incidents
     WHERE created_at >= month AND created_at < month + interval '1 month') AS reported,
    (SELECT count(*)::int FROM incidents
     WHERE resolved_at >= month AND resolved_at < month + interval '1 month') AS closed
  FROM generate_series(date_trunc('month', now()) - interval '5 months',
    date_trunc('month', now()), interval '1 month') AS month
), category_counts AS (
  SELECT c.name, c.color, count(i.id)::int AS count, c.sort_order
  FROM incident_categories c LEFT JOIN incidents i ON i.category_id = c.id
  GROUP BY c.id
), status_counts AS (
  SELECT status, count(*)::int AS count FROM incidents GROUP BY status
), severity_counts AS (
  SELECT coalesce(recalibrated_severity, severity) AS severity, count(*)::int AS count
  FROM incidents GROUP BY 1
), neighborhood_counts AS (
  SELECT neighborhood, count(*)::int AS count FROM incidents WHERE neighborhood IS NOT NULL
  GROUP BY neighborhood ORDER BY count DESC, neighborhood LIMIT 10
)
SELECT count(*)::int AS total,
  count(*) FILTER (WHERE status <> 'cerrado')::int AS active,
  count(*) FILTER (WHERE status = 'cerrado')::int AS closed,
  count(*) FILTER (WHERE resolved_at >= date_trunc('week', now()))::int AS closed_this_week,
  count(*) FILTER (WHERE created_at >= date_trunc('month', now()))::int AS this_month,
  count(DISTINCT lower(neighborhood)) FILTER
    (WHERE status <> 'cerrado' AND coalesce(recalibrated_severity, severity) >= 4)::int AS critical_areas,
  avg(extract(epoch FROM resolved_at - created_at) / 3600)::float8 AS average_close_hours,
  (SELECT jsonb_agg(month_counts ORDER BY month) FROM month_counts) AS by_month,
  (SELECT coalesce(jsonb_agg(category_counts ORDER BY sort_order, name), '[]') FROM category_counts) AS by_category,
  (SELECT coalesce(jsonb_agg(status_counts), '[]') FROM status_counts) AS by_status,
  (SELECT coalesce(jsonb_agg(severity_counts ORDER BY severity), '[]') FROM severity_counts) AS by_severity,
  (SELECT coalesce(jsonb_agg(neighborhood_counts ORDER BY count DESC, neighborhood), '[]') FROM neighborhood_counts) AS by_neighborhood
FROM incidents`;

const clean = (value) => value || null;
const rounded = (value) => Math.round(value * 1000) / 1000;

export function installIncidents(api, db, cache) {
  const moderator = authorize('moderator', 'admin');
  const admin = authorize('admin');

  api.get('/categories', async (_req, res) => {
    const { rows } = await db.query('SELECT id, name, description, color FROM incident_categories ORDER BY sort_order, name');
    res.json(rows);
  });

  api.get('/stats', async (_req, res) => {
    const cached = await cache.read();
    if (cached) return res.set('X-Prometeo-Cache', 'hit').json(cached);
    const { rows: [stats] } = await db.query(statsQuery);
    await cache.write(stats);
    res.set('X-Prometeo-Cache', 'miss').json(stats);
  });

  api.get('/incidents', async (req, res) => {
    const { scope = 'public' } = validate(z.strictObject({
      scope: z.enum(['public', 'mine']).optional(),
    }), req.query);
    if (scope === 'mine' && !req.user) throw new HttpError(401, 'Inicia sesión para ver tus reportes');
    const { rows } = await db.query(
      `SELECT ${publicFields} FROM incidents i
       WHERE ($1::uuid IS NULL OR i.user_id = $1)
       ORDER BY i.created_at DESC, i.id LIMIT 500`,
      [scope === 'mine' ? req.user.id : null],
    );
    res.json(rows);
  });

  api.get('/incidents/:id', async (req, res) => {
    const id = validate(uuid, req.params.id);
    const { rows: [incident] } = await db.query(`SELECT ${publicFields} FROM incidents i WHERE i.id = $1`, [id]);
    if (!incident) throw new HttpError(404, 'No encontramos el reporte');
    const { rows: updates } = await db.query(
      `SELECT id, status, comment, recalibrated_severity, created_at
       FROM incident_updates WHERE incident_id = $1 ORDER BY created_at, id`, [id],
    );
    res.json({ ...incident, updates });
  });

  api.post('/incidents', limit(30, 3600000), async (req, res) => {
    const input = validate(newIncident, req.body);
    if (!input.is_anonymous && !req.user) throw new HttpError(401, 'Inicia sesión o selecciona reporte anónimo');
    const { rows: [incident] } = await db.query(
      `INSERT INTO incidents
         (user_id, category_id, title, description, subcategory, severity, latitude, longitude,
          location_name, neighborhood, is_anonymous, is_precise_location, consent_updates)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING id, status, created_at`,
      [
        input.is_anonymous ? null : req.user.id, input.category_id, input.title, input.description,
        clean(input.subcategory), input.severity,
        input.is_precise_location ? input.latitude : rounded(input.latitude),
        input.is_precise_location ? input.longitude : rounded(input.longitude),
        input.is_precise_location ? clean(input.location_name) : null,
        clean(input.neighborhood), input.is_anonymous, input.is_precise_location,
        !input.is_anonymous && input.consent_updates,
      ],
    );
    await cache.invalidate();
    res.location(`/api/incidents/${incident.id}`).status(201).json(incident);
  });

  api.patch('/incidents/:id', authorize(), async (req, res) => {
    const id = validate(uuid, req.params.id);
    const { title, description } = validate(editIncident, req.body);
    const { rowCount } = await db.query(
      'UPDATE incidents SET title = $3, description = $4, updated_at = now() WHERE id = $1 AND user_id = $2',
      [id, req.user.id, title, description],
    );
    if (!rowCount) {
      const existing = await db.query('SELECT 1 FROM incidents WHERE id = $1', [id]);
      if (!existing.rowCount) throw new HttpError(404, 'No encontramos el reporte');
      throw new HttpError(403, 'Solo puedes editar tus propios reportes');
    }
    res.status(204).end();
  });

  api.post('/incidents/:id/updates', moderator, async (req, res) => {
    const id = validate(uuid, req.params.id);
    const input = validate(incidentUpdate, req.body);
    const update = await transaction(db, async (connection) => {
      const { rows: [incident] } = await connection.query(
        'SELECT status FROM incidents WHERE id = $1 FOR UPDATE', [id],
      );
      if (!incident) throw new HttpError(404, 'No encontramos el reporte');
      const next = statuses[statuses.indexOf(incident.status) + 1];
      if (input.status && input.status !== next) {
        throw new HttpError(409, 'Solo puedes avanzar al siguiente estado del reporte');
      }
      const status = input.status ?? incident.status;
      await connection.query(
        `UPDATE incidents SET status = $2, updated_at = now(),
          resolved_at = CASE WHEN $2 = 'cerrado' THEN coalesce(resolved_at, now()) ELSE NULL END,
          recalibrated_severity = coalesce($3, recalibrated_severity)
         WHERE id = $1`,
        [id, status, input.recalibrated_severity],
      );
      const { rows: [saved] } = await connection.query(
        `INSERT INTO incident_updates (incident_id, user_id, status, comment, recalibrated_severity)
         VALUES ($1, $2, $3, $4, $5) RETURNING id, status, comment, recalibrated_severity, created_at`,
        [id, req.user.id, status, clean(input.comment), input.recalibrated_severity],
      );
      return saved;
    });
    await cache.invalidate();
    res.status(201).json(update);
  });

  api.delete('/incidents/:id', admin, async (req, res) => {
    const { rowCount } = await db.query('DELETE FROM incidents WHERE id = $1', [validate(uuid, req.params.id)]);
    if (!rowCount) throw new HttpError(404, 'No encontramos el reporte');
    await cache.invalidate();
    res.status(204).end();
  });

  api.post('/admin/categories', admin, async (req, res) => {
    const { name, description, color } = validate(category, req.body);
    const { rows: [saved] } = await db.query(
      'INSERT INTO incident_categories (name, description, color) VALUES ($1, $2, $3) RETURNING id, name, description, color',
      [name, description, color],
    );
    await cache.invalidate();
    res.status(201).json(saved);
  });

  api.put('/admin/categories/:id', admin, async (req, res) => {
    const id = validate(uuid, req.params.id);
    const { name, description, color } = validate(category, req.body);
    const { rowCount } = await db.query(
      'UPDATE incident_categories SET name = $2, description = $3, color = $4 WHERE id = $1',
      [id, name, description, color],
    );
    if (!rowCount) throw new HttpError(404, 'No encontramos la categoría');
    await cache.invalidate();
    res.status(204).end();
  });

  api.delete('/admin/categories/:id', admin, async (req, res) => {
    const { rowCount } = await db.query(
      'DELETE FROM incident_categories WHERE id = $1', [validate(uuid, req.params.id)],
    );
    if (!rowCount) throw new HttpError(404, 'No encontramos la categoría');
    await cache.invalidate();
    res.status(204).end();
  });

  api.patch('/admin/roles', admin, async (req, res) => {
    const input = validate(z.strictObject({ email, role }), req.body);
    if (input.email === req.user.email) throw new HttpError(409, 'Puedes gestionar el rol de otras cuentas');
    const { rowCount } = await db.query('UPDATE users SET role = $2 WHERE email = $1', [input.email, input.role]);
    if (!rowCount) throw new HttpError(404, 'Ese correo no tiene una cuenta registrada');
    res.status(204).end();
  });
}
