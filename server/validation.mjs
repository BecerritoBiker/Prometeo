import { z } from 'zod';

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function validate(schema, input) {
  const result = schema.safeParse(input);
  if (!result.success) {
    const [{ path, message }] = result.error.issues;
    const field = path.join('.');
    throw new HttpError(400, field ? `${field} · ${message}` : message);
  }
  return result.data;
}

export const uuid = z.uuid('Identificador inválido');
export const role = z.enum(['user', 'moderator', 'admin'], 'Rol inválido');
export const email = z.string().trim().toLowerCase().max(254).pipe(z.email('Correo inválido'));
export const password = z.string().min(12, 'Usa al menos 12 caracteres').max(128, 'Usa máximo 128 caracteres');
export const account = z.strictObject({
  email, password, full_name: z.string().trim().min(2, 'Ingresa tu nombre').max(100),
});

export const statuses = ['nuevo', 'en_verificacion', 'remitido', 'cerrado'];
const severity = z.number().int().min(1).max(5);
const optionalText = (length) => z.string().trim().max(length).nullish();
const title = z.string().trim().min(5, 'Escribe al menos 5 caracteres').max(120);
const description = z.string().trim().min(10, 'Escribe al menos 10 caracteres').max(1000);

export const newIncident = z.strictObject({
  category_id: uuid,
  title,
  description,
  subcategory: optionalText(100),
  severity,
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  location_name: optionalText(150),
  neighborhood: optionalText(100),
  is_anonymous: z.boolean().default(false),
  is_precise_location: z.boolean().default(false),
  consent_updates: z.boolean().default(false),
});

export const editIncident = z.strictObject({ title, description });
export const incidentUpdate = z.strictObject({
  status: z.enum(statuses).optional(),
  comment: optionalText(500),
  recalibrated_severity: severity.optional(),
}).refine(
  (data) => Boolean(data.status || data.comment || data.recalibrated_severity),
  'Agrega un estado, un comentario o una severidad',
);

export const category = z.strictObject({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(200),
  color: z.string().regex(/^#[0-9a-f]{6}$/i, 'Color inválido'),
});
