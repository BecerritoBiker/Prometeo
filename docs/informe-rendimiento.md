# Informe comparativo de rendimiento de Prometeo

## Línea base

Se midieron dos compilaciones en el mismo servicio público, el 12 de noviembre de 2026, con Lighthouse 13.6.0 y el perfil móvil. Ambas corridas usaron el mismo navegador y entorno de medición. El certificado del dominio se comprobó también desde un ejecutor externo de GitHub Actions.

- [Línea base pública](https://prometeo-yopal-dbua.onrender.com/?medicion=base)
- [Portada optimizada](https://prometeo-yopal-dbua.onrender.com/)
- [Captura de la línea base](capturas/publico-base.png)
- [Captura de la versión optimizada](capturas/publico-optimizada.png)

Los informes completos en HTML y JSON acompañan el ZIP en `docs/lighthouse-publico/`.

## Diagnóstico

El nodo LCP fue el párrafo que comienza con «Reporta, visualiza y gestiona incidentes en Yopal» en `src/components/landing/Hero.tsx`. Lighthouse detectó un retraso de renderizado del elemento de aproximadamente 1.056 ms en la línea base. Su contenedor tenía una animación de entrada. La cadena crítica incluía `index-ChA5mX-b.js`, con 344.870 bytes de recursos y 113.394 bytes transferidos.

## Intervenciones

1. Quité la animación de entrada del bloque principal en `Hero.tsx` para permitir que el texto se pinte en cuanto se aplican los estilos.
2. Retiré de la carga inicial los proveedores de tooltips y notificaciones en `App.tsx`. Las notificaciones administrativas se montan en la página que las usa. El archivo inicial de la variante optimizada, `index-Def3GfLQ.js`, registró 267.530 bytes de recursos y 88.302 bytes transferidos.

## Medición posterior

| Versión | Hora Colombia | Rendimiento | Accesibilidad | Buenas prácticas | SEO | FCP | LCP | CLS |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Línea base | 11:55:11 | 93 | 100 | 100 | 100 | 0,89 s | 1,79 s | 0,013 |
| Optimizada | 11:55:28 | 91 | 100 | 100 | 100 | 0,84 s | 0,84 s | 0,090 |

El LCP disminuyó 0,95 s y la transferencia del JavaScript inicial bajó 25.092 bytes. El retraso de renderizado del nodo LCP pasó de 1.056 a 711 ms en el desglose de Lighthouse. El puntaje total bajó dos puntos. Lighthouse identificó desplazamientos por la carga de Cinzel y Montserrat, con CLS de 0,013 a 0,090. La accesibilidad se mantuvo en 100 en ambas variantes.

Queda por reducir el movimiento que provocan las fuentes al cargarse. Se conservó la tipografía original. La siguiente intervención puede comparar un respaldo con métricas tipográficas equivalentes.

Para repetir las dos corridas ejecuta el workflow **Lighthouse de la URL pública** o usa lo siguiente con Node 22.19+ y Chrome.

```bash
bash scripts/medir-rendimiento.sh https://prometeo-yopal-dbua.onrender.com docs/lighthouse-publico
```

[Documentación de LCP y sus fases](https://developer.chrome.com/docs/performance/insights/lcp-breakdown)
