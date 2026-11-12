CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE CHECK (email = lower(email)),
  full_name text NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 100),
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL
);

CREATE INDEX sessions_expiration_idx ON sessions (expires_at);

CREATE TABLE incident_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE CHECK (char_length(name) BETWEEN 2 AND 100),
  description text NOT NULL,
  color text NOT NULL CHECK (color ~ '^#[0-9a-fA-F]{6}$'),
  sort_order integer NOT NULL DEFAULT 100
);

CREATE TABLE incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  category_id uuid NOT NULL REFERENCES incident_categories(id),
  title text NOT NULL CHECK (char_length(title) BETWEEN 5 AND 120),
  description text NOT NULL CHECK (char_length(description) BETWEEN 10 AND 1000),
  subcategory text,
  severity smallint NOT NULL CHECK (severity BETWEEN 1 AND 5),
  recalibrated_severity smallint CHECK (recalibrated_severity BETWEEN 1 AND 5),
  status text NOT NULL DEFAULT 'nuevo'
    CHECK (status IN ('nuevo', 'en_verificacion', 'remitido', 'cerrado')),
  latitude double precision NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude double precision NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  location_name text,
  neighborhood text,
  is_anonymous boolean NOT NULL,
  is_precise_location boolean NOT NULL,
  consent_updates boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  CHECK (NOT is_anonymous OR (user_id IS NULL AND NOT consent_updates)),
  CHECK (is_precise_location OR location_name IS NULL),
  CHECK ((status = 'cerrado') = (resolved_at IS NOT NULL))
);

CREATE INDEX incidents_recent_idx ON incidents (created_at DESC, id);
CREATE INDEX incidents_user_idx ON incidents (user_id);
CREATE INDEX incidents_category_idx ON incidents (category_id);

CREATE TABLE incident_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  status text NOT NULL CHECK (status IN ('nuevo', 'en_verificacion', 'remitido', 'cerrado')),
  comment text,
  recalibrated_severity smallint CHECK (recalibrated_severity BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX incident_updates_incident_idx ON incident_updates (incident_id, created_at);

INSERT INTO incident_categories (name, description, color, sort_order) VALUES
  ('Vandalismo y Daño a la Propiedad', 'Grafitis, vidrios rotos y destrozos', '#EF4444', 1),
  ('Daños Viales y Movilidad', 'Huecos, semáforos dañados y señalización', '#F59E0B', 2),
  ('Hurtos y Seguridad Ciudadana', 'Robos a personas, vehículos o viviendas', '#DC2626', 3),
  ('Ambiente y Espacio Público', 'Basura, tala, quema y contaminación', '#10B981', 4),
  ('Servicios Públicos e Infraestructura', 'Fallas en agua, energía, gas o alumbrado', '#8B5CF6', 5),
  ('Emergencias Naturales', 'Inundaciones, incendios y deslizamientos', '#EA1212', 6),
  ('Salud y Bienestar Público', 'Plagas y otros problemas de salud pública', '#EC4899', 7),
  ('Convivencia y Orden Público', 'Riñas, ruido y problemas de convivencia', '#F97316', 8),
  ('Animales y Fauna', 'Animales heridos, abandonados o en riesgo', '#84CC16', 9),
  ('Otros/Misceláneos', 'Incidentes que no encajan en las otras categorías', '#6B7280', 10);
