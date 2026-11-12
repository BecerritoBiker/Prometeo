# Evidencias de la Entrega 4 de Prometeo

**Aplicación** · [https://prometeo-yopal-dbua.onrender.com](https://prometeo-yopal-dbua.onrender.com)

| Capacidad del punto 2 | Evidencia |
| --- | --- |
| Levanta con un comando | GitHub Actions construyó y levantó el conjunto desde un checkout limpio con `docker compose up --build -d --wait`. |
| URL pública accesible | La portada y `/api/health` respondieron desde fuera de la red local. La API informó `status: ok` y `cache: ready`. |
| HTTPS válido | OpenSSL verificó el dominio con resultado 0 desde GitHub Actions. El certificado de Google Trust Services vence el 20 de diciembre de 2026. [Certificado](certificado-https.txt) |
| Datos persistentes | La prueba de CI creó un reporte con historial, reinició los servicios y recuperó el mismo estado y sus tres seguimientos. |
| Secretos externalizados | Gitleaks pasó en GitHub Actions con historial completo. Render genera los secretos y Compose guarda su credencial en un volumen local. |
| Despliegue automático | Render vincula `main` a checks aprobados. Contrasta los últimos commits verdes con [la versión de la API](https://prometeo-yopal-dbua.onrender.com/api/version) y los eventos de Render. |
| El flujo detiene lo que falla | La rama de demostración produjo una prueba de salud roja deliberada. El trabajo de publicación quedó omitido. |
| Comprobación de salud | Compose levantó los cuatro servicios en CI y verificó su recuperación después del reinicio. |
| Rendimiento medido | Se compararon dos compilaciones sobre la URL pública. El LCP pasó de 1,79 s a 0,84 s. [Informe](informe-rendimiento.md) |
| Accesibilidad sostenida | Lighthouse móvil obtuvo 100/100 sobre las dos páginas públicas. [Captura posterior](capturas/publico-optimizada.png) |

- [CI/CD verde y publicación de imagen por commit](https://github.com/BecerritoBiker/Prometeo/actions/runs/43263535855)
- [Ejecución roja intencional](https://github.com/BecerritoBiker/Prometeo/actions/runs/43261167622)
- [Verificación externa de HTTPS](https://github.com/BecerritoBiker/Prometeo/actions/runs/43262606124)
- Imagen verificada en GHCR: `ghcr.io/becerritobiker/prometeo-entrega-4:sha-deed5159552d0525ff12c42e77643c39e861f073`.
- Digest observado: `sha256:e49c516c348eb73979889eb4ff99eeb51203a0c9d685979bc6b3c876ebb42bf1`.
