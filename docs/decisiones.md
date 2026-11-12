# Decisiones de despliegue de Prometeo

| Decisión | Motivo y efecto |
| --- | --- |
| React y API en un Dockerfile multietapa | Vite genera los archivos estáticos en una etapa y Express los sirve con la API en una imagen que instala solo las dependencias del servidor. Las cookies y los formularios usan el mismo origen. |
| Nginx como entrada local | El navegador llega a `proxy`, el único puerto publicado. Los servicios internos se comunican por nombre en Compose. Render termina HTTPS en su propio proxy. |
| PostgreSQL y volumen nombrado | Los reportes, roles y sesiones sobreviven al reinicio. Un volumen separado conserva la credencial local generada. Render inyecta conexiones privadas fuera del repositorio. |
| Redis para indicadores | El sitio consulta frecuentemente el mismo agregado de PostgreSQL. Se guarda ocho segundos y se invalida al cambiar incidentes o categorías. PostgreSQL sigue siendo la fuente de datos. |
| GitHub Actions, GHCR y Render | Actions prueba el stack y publica una imagen por SHA. Render toma el commit de `main` cuando sus checks pasan. El tag `v0.4.0` identifica la entrega. |
| Comparación en un solo despliegue | La compilación base conserva la animación del título y los proveedores iniciales. La optimizada evita ambos. Comparten datos, servidor y origen para comparar con las mismas condiciones. |

La base inicial de Lovable Cloud fue reemplazada por un esquema PostgreSQL reproducible. El ZIP compartido contenía código y migraciones, sin un volcado de los registros originales.
