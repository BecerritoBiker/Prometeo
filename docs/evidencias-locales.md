# Evidencias de verificación de Prometeo

El código y las pruebas reproducen las capacidades de la Entrega 4. La verificación pública se realiza sobre la URL de Render. Este archivo se actualiza con los resultados observados durante el cierre de la entrega.

| Capacidad | Evidencia preparada |
| --- | --- |
| Arranque y salud | `docker compose up --build -d --wait` y `docker compose ps` |
| Acceso y HTTPS | URL pública de Render, certificado del navegador y `/api/health` |
| Persistencia | Suite de integración y demostración con un reporte antes y después del reinicio |
| Secretos | `.env.example`, credencial generada y escaneo de historial con Gitleaks |
| CI/CD | `.github/workflows/ci-cd.yaml`, imagen por SHA y ejecución roja de demostración |
| Rendimiento y accesibilidad | Dos variantes medibles en un mismo origen e informe Lighthouse |
