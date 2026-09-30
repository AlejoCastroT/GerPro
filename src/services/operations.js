export const money = (value) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
export const number = (value) => new Intl.NumberFormat('es-CO').format(value);
export const parseMoney = (value) => Number(String(value ?? 0).replace(/[^0-9.-]/g, '')) || 0;

// Supabase limita las respuestas: leer páginas evita truncar inventario y métricas.
export async function readAll(makeQuery) {
  const rows = [];
  for (let from = 0; ; from += 500) {
    const { data, error } = await makeQuery().range(from, from + 499);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < 500) return rows;
  }
}

export async function loadProducts(client) {
  const rows = await readAll(() => client.from('product')
    .select('productid,name,productnumber,listprice,standardcost,color').order('productid'));
  return rows.map((p) => ({ ...p, listprice: parseMoney(p.listprice), standardcost: parseMoney(p.standardcost) }));
}

export function loadInventory(client) {
  return readAll(() => client.from('productinventory')
    .select('productid,locationid,quantity,shelf,bin,location(name)')
    .order('productid').order('locationid'));
}

export function summarize(products, inventory) {
  const commercial = products.filter((p) => p.listprice > 0);
  const totalPrice = commercial.reduce((sum, p) => sum + p.listprice, 0);
  const totalMargin = commercial.reduce((sum, p) => sum + p.listprice - p.standardcost, 0);
  const locations = new Map();
  for (const row of inventory) {
    const current = locations.get(row.locationid) || { id: row.locationid, name: row.location?.name || `Ubicación ${row.locationid}`, quantity: 0, records: 0 };
    current.quantity += Number(row.quantity) || 0;
    current.records++;
    locations.set(row.locationid, current);
  }
  return {
    commercial, totalProducts: products.length, totalUnits: inventory.reduce((sum, row) => sum + Number(row.quantity || 0), 0),
    empty: inventory.filter((row) => Number(row.quantity) === 0).length,
    avgPrice: commercial.length ? totalPrice / commercial.length : 0,
    margin: totalPrice ? totalMargin / totalPrice * 100 : 0,
    locations: [...locations.values()].sort((a, b) => b.quantity - a.quantity),
  };
}

export function matchesProduct(product, query) {
  return [product?.name, product?.productnumber, product?.productid].some((value) => String(value ?? '').toLowerCase().includes(query.trim().toLowerCase()));
}

export function csvText(rows) {
  return '\uFEFF' + rows.map((row) => row.map((value) => {
    let text = String(value ?? '');
    // Evitar que una hoja de cálculo interprete textos como fórmulas.
    if (typeof value === 'string' && /^[\s]*[=+@-]/.test(text)) text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
  }).join(',')).join('\r\n');
}

export function downloadCsv(filename, rows) {
  const url = URL.createObjectURL(new Blob([csvText(rows)], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
