# Modelo de datos de Prometeo

PostgreSQL aplica `db/migrations/001_initial.sql` al iniciar la aplicación. La tabla `schema_migrations` registra las migraciones ya aplicadas.

| Tabla | Función y relaciones |
| --- | --- |
| `users` | Correo único, nombre, rol y contraseña protegida con scrypt. |
| `sessions` | Hash del token y vencimiento. Pertenece a una cuenta y se elimina al cerrar sesión. |
| `incident_categories` | Catálogo de diez categorías iniciales. Cada categoría puede tener varios incidentes. |
| `incidents` | Reporte con título, categoría, severidad de 1 a 5, ubicación y estado. La cuenta es opcional para reportes anónimos. |
| `incident_updates` | Historial de seguimiento, estado, comentario y fecha. Pertenece a un incidente y se elimina con él. |

El flujo de estado es **nuevo → en verificación → remitido → cerrado**. La API guarda el cambio y el historial en una transacción. El backend valida roles y propiedad antes de modificar datos. La consulta pública de incidentes omite las cuentas y redondea las ubicaciones marcadas como aproximadas.
