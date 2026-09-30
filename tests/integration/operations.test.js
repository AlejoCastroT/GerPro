import { describe, expect, it } from 'vitest';
import { csvText, parseMoney, readAll, summarize } from '../../src/services/operations';

describe('datos de operaciones', () => {
  it('consulta más de 1000 registros sin truncar las métricas', async () => {
    const source = Array.from({ length: 1069 }, (_, id) => ({ id }));
    const ranges = [];
    const result = await readAll(() => ({ range: async (start, end) => {
      ranges.push([start, end]);
      return { data: source.slice(start, end + 1), error: null };
    } }));
    expect(result).toHaveLength(1069);
    expect(ranges).toEqual([[0, 499], [500, 999], [1000, 1499]]);
  });
  it('rechaza una carga incompleta si falla una página', async () => {
    await expect(readAll(() => ({ range: async (start) => start === 0
      ? { data: Array(500).fill({}) } : { error: new Error('Sin acceso') } }))).rejects.toThrow('Sin acceso');
  });
  it('calcula stock y margen sin confundirlos con ventas', () => {
    const result = summarize([{ listprice: 100, standardcost: 60 }, { listprice: 0, standardcost: 20 }, { listprice: 300, standardcost: 250 }], [
      { locationid: 1, quantity: 0, location: { name: 'A' } },
      { locationid: 1, quantity: 5, location: { name: 'A' } },
      { locationid: 2, quantity: 10, location: { name: 'B' } },
    ]);
    expect(result.totalUnits).toBe(15);
    expect(result.empty).toBe(1);
    expect(result.avgPrice).toBe(200);
    expect(result.margin).toBe(22.5);
    expect(result.locations[0]).toMatchObject({ name: 'B', quantity: 10 });
  });
  it('tolera un catálogo vacío y el tipo money recibido desde Supabase', () => {
    expect(parseMoney('$1,234.56')).toBe(1234.56);
    expect(summarize([], []).margin).toBe(0);
  });
  it('exporta CSV escapado sin ejecutar fórmulas de los nombres', () => {
    const csv = csvText([['Nombre', 'Valor'], ['=HYPERLINK("x")', 12], ['A, "B"', -2]]);
    expect(csv).toContain('"\'=HYPERLINK(""x"")"');
    expect(csv).toContain('"A, ""B""","-2"');
  });
});
