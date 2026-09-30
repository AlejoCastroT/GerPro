import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse, delay } from 'msw';
import { setupServer } from 'msw/node';
import WorkOrders from '../../src/components/WorkOrders';
import { orderPayload } from '../../src/services/workOrders';

const endpoint = 'https://integration.supabase.test/rest/v1/workorder';
let rows;
let writes;
const server = setupServer(
  http.get(endpoint, () => HttpResponse.json(rows)),
  http.post(endpoint, async ({ request }) => {
    writes++;
    const [payload] = await request.json();
    const row = { ...payload, workorderid: 12345, product: { name: 'Road Bike' } };
    rows.unshift(row);
    return HttpResponse.json(row, { status: 201 });
  }),
);
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => { rows = []; writes = 0; });
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

async function fillForm({ start = '2026-10-01', end = '2026-10-02' } = {}) {
  const user = userEvent.setup();
  render(<WorkOrders products={[{ productid: 680, name: 'Road Bike' }]} />);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Nueva Orden' })).toBeEnabled());
  await user.click(screen.getByRole('button', { name: 'Nueva Orden' }));
  await user.selectOptions(screen.getByLabelText('Producto a ensamblar'), '680');
  await user.type(screen.getByLabelText('Cantidad Ordenada (OrderQty)'), '7');
  await user.type(screen.getByLabelText('Fecha de Inicio'), start);
  await user.type(screen.getByLabelText('Fecha de Fin'), end);
  return user;
}

describe('React → cliente Supabase → API HTTP simulada', () => {
  it('guarda todos los campos y vuelve a consultar la orden al montar el listado', async () => {
    const user = await fillForm();
    await user.click(screen.getByRole('button', { name: 'Guardar Orden de Trabajo' }));
    expect(await screen.findByRole('status')).toHaveTextContent('registrada exitosamente');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('WO-12345')).toBeInTheDocument();
    expect(writes).toBe(1);
    expect(rows[0]).toMatchObject({ productid: 680, orderqty: 7, stockedqty: 7,
      scrappedqty: 0, startdate: '2026-10-01', enddate: '2026-10-02', duedate: '2026-10-02' });
    expect(Number.isFinite(Date.parse(rows[0].modifieddate))).toBe(true);
    // Una instancia nueva debe recuperar el registro mediante GET.
    const { unmount } = render(<WorkOrders products={[]} />);
    await waitFor(() => expect(screen.getAllByText('WO-12345')).toHaveLength(2));
    unmount();
  });

  it('rechaza fechas invertidas sin escribir', async () => {
    const user = await fillForm({ start: '2026-10-03', end: '2026-10-02' });
    await user.click(screen.getByRole('button', { name: 'Guardar Orden de Trabajo' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('no puede ser posterior');
    expect(writes).toBe(0);
  });

  it('muestra rechazo de Supabase y conserva el formulario para corregirlo', async () => {
    server.use(http.post(endpoint, () => HttpResponse.json({ message: 'new row violates row-level security policy', code: '42501' }, { status: 403 })));
    const user = await fillForm();
    await user.click(screen.getByRole('button', { name: 'Guardar Orden de Trabajo' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('row-level security');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Cantidad Ordenada (OrderQty)')).toHaveValue(7);
    expect(screen.getByRole('button', { name: 'Guardar Orden de Trabajo' })).toBeEnabled();
  });

  it('bloquea doble clic mientras la respuesta está pendiente', async () => {
    server.use(http.post(endpoint, async () => {
      writes++;
      await delay(150);
      return HttpResponse.json({ workorderid: 12345, orderqty: 7, product: { name: 'Road Bike' } }, { status: 201 });
    }));
    const user = await fillForm();
    await user.dblClick(screen.getByRole('button', { name: 'Guardar Orden de Trabajo' }));
    expect(screen.getByRole('button', { name: 'Guardando...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cerrar formulario' })).toBeDisabled();
    await screen.findByRole('status');
    expect(writes).toBe(1);
  });

  it('distingue un error de lectura de una lista vacía', async () => {
    server.use(http.get(endpoint, () => HttpResponse.json({ message: 'Database unavailable' }, { status: 503 })));
    render(<WorkOrders products={[]} />);
    expect(await screen.findByRole('alert', {}, { timeout: 15000 })).toHaveTextContent('No se pudieron cargar');
  }, 20000);
});

describe('validación antes de escribir', () => {
  const valid = { productId: '680', orderQty: '7', startDate: '2026-10-01', endDate: '2026-10-02' };
  it.each(['0', '-1', '1.5', '', 'abc', '2147483648'])('rechaza cantidad %j', (orderQty) => {
    expect(() => orderPayload({ ...valid, orderQty })).toThrow('La cantidad');
  });
  it.each(['', '0', 'abc', '2.5'])('rechaza producto %j', (productId) => {
    expect(() => orderPayload({ ...valid, productId })).toThrow('producto válido');
  });
  it.each(['', '2026-02-30', 'fecha'])('rechaza fecha %j', (startDate) => {
    expect(() => orderPayload({ ...valid, startDate })).toThrow('fechas válidas');
  });
  it('acepta inicio y fin el mismo día', () => {
    expect(orderPayload({ ...valid, endDate: valid.startDate }).duedate).toBe(valid.startDate);
  });
});
