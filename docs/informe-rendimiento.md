# Informe comparativo de rendimiento de Prometeo

## Línea base

La línea base se obtiene en `/?medicion=base`. La portada optimizada se mide en `/`. Las dos variantes usan el mismo servidor y comparten datos, dependencias y red. El workflow **Lighthouse de la URL pública** usa el perfil móvil para ambas.

## Diagnóstico

La portada contiene un encabezado grande en `src/components/landing/Hero.tsx`. La versión base aplicaba una animación de entrada y montaba desde `src/App.tsx` los proveedores de notificaciones y tooltips. El informe de Lighthouse permite comparar el nodo LCP y el archivo JavaScript principal.

## Intervenciones

1. Se retiró la animación de entrada del encabezado principal en la variante optimizada. El título puede pintarse en cuanto el navegador tiene sus estilos.
2. Se sacaron de la carga inicial los proveedores globales de tooltips y notificaciones. La gestión de administrador monta las notificaciones cuando se usan.

## Medición posterior

Se documentarán aquí las dos ejecuciones con fecha, métricas, nodo LCP y enlace a la evidencia. Ejecuta `bash scripts/medir-rendimiento.sh URL_PUBLICA docs/lighthouse-publico` o el workflow equivalente. Los informes de una URL local tienen alcance de verificación previa.
