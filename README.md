# AdventureWorks — Control de producción

Frontend React + Vite. Supabase aloja PostgreSQL, Auth y la API; no hay servidor Node/Express independiente.

**Aplicación publicada:** https://adventureworks-dashboard-beta.vercel.app

Proyecto Vercel: `alejandro-9e12/adventureworks-dashboard`. Publicado mediante CLI; el despliegue automático desde GitHub todavía no está conectado. La pantalla de acceso se verificó en Chromium desde la URL pública.

## Módulos disponibles

- **Dashboard:** resumen del catálogo y stock, distribución por ubicación y accesos a la operación.
- **Productos:** catálogo completo, búsqueda por nombre/código/ID, filtros por precio de venta, ordenación, paginación, consulta de inventario y exportación CSV de los resultados filtrados.
- **Inventario:** existencias por producto y ubicación, filtros de centro y cantidad, detalle y exportación CSV. La banda de 1–10 unidades es un filtro de consulta, no un umbral de reposición definido por la empresa.
- **Analítica:** productos con mayor precio, comparación precio/costo, distribución de unidades y margen del catálogo; no representa ventas ni utilidad realizada.
- **Órdenes:** consulta de las últimas 20 órdenes y formulario de creación conectado a Supabase.

La consulta de productos e inventario recorre páginas de 500 registros. Los gráficos se cargan bajo demanda. La interfaz contempla errores, listas vacías, navegación móvil y movimiento reducido. Se conserva el esquema existente de Supabase.

## Ejecutar localmente

Requiere Node.js 22.12+ (recomendado: 24).

```sh
npm ci
npm run dev
```

Copiar `.env.example` a `.env.local` y completar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. Usar una clave **publishable o anon**, nunca `service_role` ni una clave secreta: las variables `VITE_` son públicas. En PowerShell, usar `npm.cmd` si la política bloquea `npm.ps1`.

El esquema AdventureWorks debe existir previamente: `product`, `workorder`, `productinventory` y `location` en `public`, con sus relaciones. Este repositorio no contiene el respaldo ni una migración completa de esa base.

## Pruebas

```sh
npm run lint
npm test
npm run build
```

`npm test` ejecuta React y el SDK real de Supabase contra una API HTTP simulada con MSW. Verifica inserción, lectura, validaciones, errores y doble envío. **No demuestra persistencia en Supabase remoto.** GitHub Actions ejecuta estos controles; su build usa valores ficticios y no se publica.

Para comprobar persistencia real, crear `.env.test.local` (ignorado por Git):

```dotenv
E2E_EMAIL=usuario-de-prueba-confirmado@example.com
E2E_PASSWORD=contraseña-del-usuario-de-prueba
# Opcional, para probar el frontend publicado:
# E2E_BASE_URL=https://tu-proyecto.vercel.app
```

La URL y clave pública se cargan de `.env`/`.env.local`; se pueden sobrescribir en `.env.test.local` para un proyecto de pruebas con el mismo esquema. El usuario debe poder consultar productos y órdenes, insertar una orden y eliminar su registro de prueba. No usar `service_role` ni desactivar RLS.

```sh
npx playwright install chromium
npm run test:smoke
npm run test:ui
npm run test:e2e
npm run test:report
```

`test:smoke` comprueba el login en Chromium. `test:e2e` falla explícitamente si faltan credenciales. Guarda una orden de una unidad desde React, consulta sus campos por ID directamente en Supabase, recarga y comprueba que sigue visible. Adjunta el registro y una captura al informe HTML en `playwright-report/`.

`test:ui` recorre los módulos en escritorio y móvil con autenticación y respuestas HTTP simuladas únicamente dentro de Playwright. Comprueba filtros, exportación, detalle, navegación y errores; no escribe en Supabase ni demuestra autenticación o persistencia remota. Las capturas usan datos de prueba.

La prueba elimina exclusivamente el ID devuelto por su INSERT, incluso si falla una comprobación posterior. Si faltan permisos DELETE, falla e indica el ID para limpieza manual. Usar preferiblemente un proyecto de pruebas: una interrupción de red después del INSERT y antes de recibir su ID puede dejar un registro para revisión manual. No hay reintentos automáticos de escritura. Revisar los informes antes de compartirlos: pueden contener datos de productos.

## Despliegue: Vercel + Supabase

1. En Vercel, crear un proyecto personal Hobby e importar el repositorio. Hobby permite uso personal no comercial, sujeto a sus límites.
2. Elegir **Vite**, Node.js **24**, instalación `npm ci`, build `npm run build` y salida `dist`. `vercel.json` incluye la configuración y fallback de SPA.
3. Configurar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en Production y, si se usan, Preview. No subir credenciales de prueba. Cambiar variables requiere un nuevo build.
4. Publicar con **Deploy**. Alternativa CLI: `npx vercel login`, `npx vercel link`, configurar las variables en el panel y ejecutar `npx vercel --prod`.
5. En Supabase → Authentication → URL Configuration, establecer **Site URL** con la URL definitiva y añadir los destinos de redirección necesarios. Verificar confirmación de correo e inicio/cierre de sesión.
6. Ejecutar `test:smoke` y `test:e2e` con `E2E_BASE_URL` apuntando al frontend publicado. Adjuntar URL e informe al issue académico.

**Backend:** el Supabase configurado ya es el servicio en la nube. `src/supabaseClient.js` se ejecuta en el navegador y no se despliega como servidor. Si la materia exige código propio de backend, concretar ese requisito; Supabase admite Edge Functions y funciones PostgreSQL.

Comprobar permisos y políticas RLS de las cuatro tablas según las reglas de acceso de la materia: el login de React por sí solo no protege las tablas. No crear políticas globales para resolver un error de permisos. El despliegue del frontend no modifica el esquema ni los permisos existentes.

El `.env` original se retiró del versionado conservando el archivo local; `.env.example` contiene la plantilla sin credenciales. El historial anterior sigue conteniendo el archivo original. Una clave pública de Supabase no sustituye las políticas RLS.

## Evidencia académica

Ver [plan y registro de validación](docs/VALIDACION.md). No confundir pruebas simuladas con una escritura remota aprobada ni configuración de despliegue con una URL publicada.

Referencias oficiales: [Vite en Vercel](https://vercel.com/docs/frameworks/frontend/vite), [plan Hobby](https://vercel.com/docs/plans/hobby), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [redirecciones Auth](https://supabase.com/docs/guides/auth/redirect-urls), [Playwright](https://playwright.dev/docs/test-configuration).
