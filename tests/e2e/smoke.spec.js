import { test, expect } from '@playwright/test';

test('el frontend muestra el acceso sin errores de JavaScript', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'AdventureWorks', exact: true })).toBeVisible();
  await expect(page.getByLabel('Correo Electrónico')).toBeVisible();
  await expect(page.getByLabel('Contraseña', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Entrar al Sistema' })).toBeEnabled();
  expect(errors).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath('acceso.png'), fullPage: true });
});
