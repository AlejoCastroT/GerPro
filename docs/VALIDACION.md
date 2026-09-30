# Validación académica

## Issue: integración React → Supabase (HU-03)

**Aceptación:** una orden enviada desde React se almacena con producto, cantidad y fechas correctos; una consulta independiente por ID y una recarga confirman persistencia.

| Caso | Comando | Alcance |
| --- | --- | --- |
| Guardado y recuperación | `npm test` | React + SDK + HTTP simulado |
| Fechas y cantidades inválidas | `npm test` | Sin INSERT |
| Errores de lectura y permisos | `npm test` | Error visible, sin éxito falso |
| Doble clic | `npm test` | Un solo INSERT |
| Login visible | `npm run test:smoke` | Chromium |
| Guardar, consultar y recargar | `npm run test:e2e` | Supabase real |
| Limpieza del ID creado | `npm run test:e2e` | DELETE y consulta posterior |

Conservar informe HTML, adjuntos, fecha y revisión de Git. El E2E requiere usuario confirmado y permisos de limpieza. No cerrar este issue solo con pruebas simuladas.

## Issue: despliegue

**Aceptación:** URL HTTPS accesible, autenticación funcional y orden persistente desde esa URL.

- Frontend: Vercel, Vite, salida `dist`, variables públicas de Supabase.
- Backend: proyecto Supabase existente (PostgreSQL + Auth + API).
- Verificación: ambas pruebas de navegador con `E2E_BASE_URL` publicado.
- Registrar URL pública, proyecto Supabase (sin claves), revisión desplegada y fecha.

## Estado de la intervención

Fecha inicial: 2026-09-29, America/Bogota.

Publicación y comprobación en producción: 2026-09-29, 23:40 (UTC−05:00). Se desplegó el directorio de trabajo con los cambios locales de esta intervención; commit base `ad503a3fb1e1e1dbdd2b3d7b50fa5afc4c2287ef`. Esa publicación se realizó antes de confirmar los cambios en Git.

- Conectividad: consulta real a `product`, HTTP 200, un registro visible con la clave pública configurada.
- Persistencia remota: pendiente de credenciales de prueba. HTTP 200 de lectura no prueba escritura ni valida RLS.
- Publicación: completada en https://adventureworks-dashboard-beta.vercel.app mediante Vercel CLI. Proyecto `alejandro-9e12/adventureworks-dashboard`; despliegue `dpl_ENfsyrSuojw3jXpwM94B9JKovmoP`, estado `READY`.
- Variables públicas `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` configuradas para Production y Preview. `.vercelignore` excluye archivos de entorno e informes de la subida.
- Prueba en producción: `E2E_BASE_URL=https://adventureworks-dashboard-beta.vercel.app npm run test:smoke`, 1 prueba aprobada en Chromium sin sesión de Vercel; login visible y sin errores de JavaScript. Informe local en `playwright-report/index.html`.
- Inicio de sesión de la aplicación y persistencia de órdenes desde producción: pendientes del usuario de prueba. La configuración de Site URL/redirecciones en Supabase no se modificó, porque aún no hay acceso administrativo a ese proyecto.
- GitHub: la publicación por CLI funciona. La conexión automática de `AlejoCastroT/GerPro` no quedó habilitada porque Vercel requiere vincular el inicio de sesión de GitHub a la cuenta.
- `npm run lint`: aprobado, sin errores.
- `npm test`: 24 pruebas aprobadas; incluye integración HTTP de órdenes, validación, paginación de 1.069 registros, errores de páginas, métricas y exportación CSV.
- `npm run build`: aprobado. Después del rediseño, el bundle inicial es de aproximadamente 445 kB (127 kB comprimido); analítica se carga por separado.
- `npm audit fix`: aplicada actualización compatible de `brace-expansion`; auditoría posterior sin vulnerabilidades conocidas.
- `npm run test:smoke`: 1 prueba aprobada en Chromium; login visible sin errores de JavaScript. Informe local en `playwright-report/index.html`. Se ejecutó fuera del sandbox para permitir el cierre de los procesos del navegador y del servidor.

## Ampliación de módulos y diseño

Publicada el 2026-09-30 en la misma URL; despliegue `dpl_D8fBy88ZqDB6SCyZmczAY4A68n9f`, estado `READY`. Las 4 pruebas de navegador también aprobaron contra el frontend publicado (8,8 segundos). La prueba de acceso usa la web real; las pruebas de módulos interceptan las respuestas HTTP con datos controlados. La lectura real del catálogo e inventario se comprobó de forma independiente.

- Productos, Inventario y Analítica reemplazan las secciones en construcción con búsquedas, filtros, exportación y métricas obtenidas del esquema existente.
- Rediseño del acceso y del panel; navegación adaptable, foco visible, cierre por Escape del detalle, tratamiento de errores y eliminación del indicador fijo de disponibilidad.
- 4 pruebas de Chromium aprobadas: acceso, flujo por módulos, navegación móvil y fallo de inventario. Las 3 pruebas de módulos usan respuestas y autenticación simuladas, sin escrituras remotas.
- Lectura real con el nuevo servicio: 504 productos, 304 con precio de venta, 1.069 registros de inventario, 14 ubicaciones y 335.974 unidades al verificar. Precios y costos convertidos a números finitos. Estas cifras son una instantánea, no valores fijos de la interfaz.

## Aclaración de referencias en la gráfica (2026-09-30)

Consulta directa a `product` con el mismo servicio del frontend: las referencias 749–753 corresponden a Road-150 Red en tallas 62, 44, 48, 52 y 56. Cada una registra precio 3578.27 USD y costo 2171.29 USD. La igualdad de las barras proviene de esos valores; los nombres recortados ocultaban la diferencia entre variantes.

El eje utiliza ahora `productnumber`, y el tooltip muestra nombre completo, código y valores con dos decimales. Se conservan el ranking, los datos, colores y distribución. Lint, build y las tres pruebas existentes de módulos en Chromium aprobados.

Publicado en el despliegue `dpl_95dAanWTvNoKiPytsSf9FyP9j2hV`, estado `READY`, en la misma URL de producción.

## Semántica de las órdenes

Se conserva la inserción existente: `stockedqty = orderqty`, `scrappedqty = 0`, `duedate = enddate`. Confirmar con el docente si una orden programada debe representar existencias ya producidas; no se redefine ese modelo de negocio. El listado muestra las últimas 20 órdenes. No se suministró una rúbrica que permita certificar todos los requisitos académicos.
