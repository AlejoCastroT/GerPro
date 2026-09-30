import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

test('una orden guardada en React persiste en Supabase y tras recargar', async ({ page }, testInfo) => {
  for (const name of ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'E2E_EMAIL', 'E2E_PASSWORD']) {
    if (!process.env[name]) throw new Error(`Configure ${name} en .env.test.local para ejecutar la prueba real.`);
  }
  const client = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: authError } = await client.auth.signInWithPassword({
    email: process.env.E2E_EMAIL, password: process.env.E2E_PASSWORD,
  });
  if (authError) throw new Error(`No se pudo autenticar el usuario de prueba: ${authError.message}`);

  let insertedId;
  try {
    const { data: products, error } = await client.from('product').select('productid')
      .gt('listprice', 0).order('productid').limit(1);
    if (error) throw error;
    expect(products.length, 'Debe existir al menos un producto comercial visible').toBe(1);
    const productid = products[0].productid;

    await page.goto('/');
    await page.getByLabel('Correo Electrónico').fill(process.env.E2E_EMAIL);
    await page.getByLabel('Contraseña', { exact: true }).fill(process.env.E2E_PASSWORD);
    await page.getByRole('button', { name: 'Entrar al Sistema' }).click();
    await page.getByRole('heading', { name: /Panel de Control/ }).waitFor();
    await page.getByRole('button', { name: 'Órdenes Trabajo', exact: true }).click();
    await page.getByRole('button', { name: 'Nueva Orden' }).click();
    await page.getByLabel('Producto a ensamblar').selectOption(String(productid));
    await page.getByLabel('Cantidad Ordenada (OrderQty)').fill('1');
    const day = new Date().toISOString().slice(0, 10);
    await page.getByLabel('Fecha de Inicio').fill(day);
    await page.getByLabel('Fecha de Fin').fill(day);

    const responsePromise = page.waitForResponse((response) =>
      response.request().method() === 'POST' && new URL(response.url()).pathname === '/rest/v1/workorder');
    await page.getByRole('button', { name: 'Guardar Orden de Trabajo' }).click();
    const response = await responsePromise;
    expect(response.ok(), 'Supabase debe aceptar INSERT y devolver la fila').toBeTruthy();
    const saved = await response.json();
    insertedId = saved.workorderid;
    expect(insertedId).toBeTruthy();
    await expect(page.getByRole('status')).toContainText('registrada exitosamente');

    // Consulta independiente: no basta con que React muestre un mensaje de éxito.
    const { data: stored, error: readError } = await client.from('workorder')
      .select('workorderid, productid, orderqty, stockedqty, scrappedqty, startdate, enddate, duedate')
      .eq('workorderid', insertedId).single();
    if (readError) throw readError;
    expect(stored).toMatchObject({ workorderid: insertedId, productid, orderqty: 1, stockedqty: 1, scrappedqty: 0 });
    for (const field of ['startdate', 'enddate', 'duedate']) expect(stored[field].slice(0, 10)).toBe(day);
    await testInfo.attach('orden-verificada-en-supabase.json', {
      body: JSON.stringify({ verifiedAt: new Date().toISOString(), order: stored }, null, 2),
      contentType: 'application/json',
    });

    await page.reload();
    await page.getByRole('button', { name: 'Órdenes Trabajo', exact: true }).click();
    await expect(page.getByRole('cell', { name: `WO-${insertedId}`, exact: true })).toBeVisible();
    await testInfo.attach('orden-despues-de-recargar.png', {
      body: await page.locator('main').screenshot(), contentType: 'image/png',
    });
  } finally {
    try {
      if (insertedId) {
        // Eliminar exclusivamente la fila que devolvió el INSERT de esta ejecución.
        const { data, error } = await client.from('workorder').delete()
          .eq('workorderid', insertedId).select('workorderid');
        expect(error, `Limpieza pendiente: workorderid=${insertedId}`).toBeNull();
        expect(data, `Limpieza pendiente: eliminar manualmente workorderid=${insertedId}. Revise permisos DELETE.`).toHaveLength(1);
        const { data: remaining, error: verifyError } = await client.from('workorder')
          .select('workorderid').eq('workorderid', insertedId);
        expect(verifyError).toBeNull();
        expect(remaining).toHaveLength(0);
      }
    } finally {
      await client.auth.signOut();
    }
  }
});
