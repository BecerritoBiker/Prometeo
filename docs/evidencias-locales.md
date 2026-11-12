# Verificaciones funcionales de Prometeo

Se verificó la compilación de ambas portadas, la consulta de PostgreSQL y el uso de Redis para los indicadores. La suite completó registro, validación de datos, roles, transiciones concurrentes, historial, reinicio y revocación de sesión. En Chromium se completaron el formulario, la ubicación manual, el mapa, los filtros, la moderación en pantalla móvil y el cierre de sesión.

El escenario intencional comprueba que un fallo en la prueba de salud bloquea el trabajo de publicación. Las pruebas de Docker Compose se ejecutaron en GitHub Actions. Las mediciones públicas de Lighthouse y la validación del certificado se registran en [Evidencias de la Entrega 4](evidencias-publicas.md).
