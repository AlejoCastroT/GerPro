export const orderSelection = 'workorderid, productid, orderqty, stockedqty, scrappedqty, startdate, enddate, duedate, product ( name )';

export function orderPayload({ productId, orderQty, startDate, endDate }) {
  const productid = Number(productId);
  const orderqty = Number(orderQty);
  if (!Number.isSafeInteger(productid) || productid <= 0) {
    throw new Error('Seleccione un producto válido.');
  }
  if (!Number.isSafeInteger(orderqty) || orderqty <= 0 || orderqty > 2147483647) {
    throw new Error('La cantidad debe ser un entero entre 1 y 2147483647.');
  }
  const validDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value)
    && Number.isFinite(Date.parse(value))
    && new Date(value).toISOString().slice(0, 10) === value;
  if (!validDate(startDate) || !validDate(endDate)) {
    throw new Error('Ingrese fechas válidas de inicio y fin.');
  }
  if (startDate > endDate) {
    throw new Error('La Fecha de Inicio no puede ser posterior a la Fecha de Fin.');
  }
  return {
    productid, orderqty, stockedqty: orderqty, scrappedqty: 0,
    startdate: startDate, enddate: endDate, duedate: endDate,
    modifieddate: new Date().toISOString(),
  };
}

export async function listWorkOrders(client) {
  const { data, error } = await client.from('workorder').select(orderSelection)
    .order('workorderid', { ascending: false }).limit(20);
  if (error) throw error;
  return data ?? [];
}

export async function createWorkOrder(client, values) {
  const { data, error } = await client.from('workorder')
    .insert([orderPayload(values)]).select(orderSelection).single();
  if (error) throw error;
  if (!data?.workorderid) throw new Error('Supabase no devolvió la orden guardada. Verifique el listado antes de reintentar.');
  return data;
}
