import { test, expect } from '@playwright/test';

// Datos controlados solo en el navegador de pruebas; no escriben en Supabase.
const products = Array.from({ length: 504 }, (_, i) => ({ productid: i + 1, name: i === 0 ? 'Bicicleta Aurora' : `Componente ${String(i + 1).padStart(3, '0')}`, productnumber: `AW-${i + 1}`, listprice: i === 0 ? '$1,200.00' : '$100.00', standardcost: '$60.00', color: 'Black' }));
const inventory = Array.from({ length: 1069 }, (_, i) => ({ productid: i % 504 + 1, locationid: Math.floor(i / 504) + 1, quantity: i === 0 ? 0 : i === 1 ? 5 : 25, shelf: 'A', bin: 1, location: { name: `Centro ${Math.floor(i / 504) + 1}` } }));

async function openWorkspace(page, { inventoryFailure = false } = {}) {
  const endpoint = process.env.VITE_SUPABASE_URL;
  const user = { id: '00000000-0000-4000-8000-000000000001', aud: 'authenticated', role: 'authenticated', email: 'operador@example.test', user_metadata: { full_name: 'Operador de prueba' } };
  await page.route(`${endpoint}/**`, async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.includes('/auth/v1/token')) return route.fulfill({ json: { access_token: 'test-session-token', refresh_token: 'test-refresh', expires_in: 3600, token_type: 'bearer', user } });
    if (url.pathname.includes('/auth/v1/user')) return route.fulfill({ json: user });
    if (url.pathname.includes('/auth/v1/logout')) return route.fulfill({ status: 204 });
    if (url.pathname.endsWith('/productinventory') && inventoryFailure) return route.fulfill({ status: 403, json: { message: 'Acceso a inventario denegado' } });
    let rows = url.pathname.endsWith('/productinventory') ? inventory : url.pathname.endsWith('/product') ? products : [];
    const productFilter = url.searchParams.get('productid');
    if (productFilter) rows = rows.filter((r) => r.productid === Number(productFilter.replace('eq.', '')));
    const start = Number(url.searchParams.get('offset') || 0);
    const limit = Number(url.searchParams.get('limit') || rows.length);
    return route.fulfill({ json: rows.slice(start, start + limit) });
  });
  await page.goto('/');
  await page.getByLabel('Correo Electrónico').fill('operador@example.test');
  await page.getByLabel('Contraseña', { exact: true }).fill('only-test-password');
  await page.getByRole('button', { name: 'Entrar al Sistema' }).click();
  if (inventoryFailure) await expect(page.getByRole('alert')).toBeVisible();
  else await expect(page.getByText('26.680', { exact: true })).toBeVisible();
}

test('los módulos permiten consultar, filtrar, exportar y navegar', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await openWorkspace(page);
  await expect(page.getByText('504', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Productos de mayor valor' })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('dashboard-desktop.png'), fullPage: true });
  await page.getByRole('button', { name: 'Productos', exact: true }).click();
  await page.getByLabel('Buscar productos').fill('Aurora');
  await expect(page.getByText('Bicicleta Aurora', { exact: true })).toBeVisible();
  await expect(page.getByText('1 productos · Valores en USD')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('productos-desktop.png'), fullPage: true });
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar CSV' }).click();
  expect((await downloadPromise).suggestedFilename()).toBe('adventureworks-productos.csv');
  await page.getByRole('button', { name: 'Ver inventario de Bicicleta Aurora' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByText('50 uds', { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Inventario', exact: true }).click();
  await page.screenshot({ path: testInfo.outputPath('inventario-desktop.png'), fullPage: true });
  await page.getByLabel('Estado de stock').selectOption('empty');
  await expect(page.getByText('1 registros · 0 unidades')).toBeVisible();
  await page.getByLabel('Ubicación', { exact: true }).selectOption('2');
  await expect(page.getByText('Sin registros para estos filtros')).toBeVisible();
  await page.getByRole('button', { name: 'Analítica', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Precio de lista vs. costo estándar' })).toBeVisible();
  await page.getByRole('button', { name: 'Órdenes Trabajo', exact: true }).click();
  await page.getByRole('button', { name: 'Nueva Orden' }).click();
  await expect(page.getByRole('dialog', { name: 'Registrar Orden' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('navegación móvil sin desbordamiento horizontal', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openWorkspace(page);
  await expect(page.getByRole('heading', { name: 'Productos de mayor valor' })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('dashboard-mobile.png'), fullPage: true });
  await page.getByRole('button', { name: 'Abrir menú' }).click();
  await page.getByRole('button', { name: 'Productos', exact: true }).click();
  await expect(page.getByLabel('Buscar productos')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByLabel('Buscar productos').fill('no-existe');
  await expect(page.getByText('No encontramos productos')).toBeVisible();
});

test('un error de inventario se muestra sin presentar métricas falsas', async ({ page }) => {
  await openWorkspace(page, { inventoryFailure: true });
  await expect(page.getByRole('alert')).toContainText('Acceso a inventario denegado');
  await expect(page.getByText('Revisar conexión')).toBeVisible();
  await page.getByRole('button', { name: 'Productos', exact: true }).click();
  await expect(page.getByLabel('Buscar productos')).toBeVisible();
});
