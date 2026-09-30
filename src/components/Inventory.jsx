import { useState } from 'react';
import { Download, Search } from 'lucide-react';
import { downloadCsv, matchesProduct, number } from '../services/operations';

export default function Inventory({ inventory, products, locations, onInspect }) {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('all');
  const [stock, setStock] = useState('all');
  const [page, setPage] = useState(0);
  const productMap = new Map(products.map((p) => [p.productid, p]));
  const filtered = inventory.filter((row) => matchesProduct(productMap.get(row.productid) || { productid: row.productid }, query)
    && (location === 'all' || String(row.locationid) === location)
    && (stock === 'all' || (stock === 'empty' ? Number(row.quantity) === 0 : Number(row.quantity) > 0 && Number(row.quantity) <= 10)));
  const pages = Math.max(1, Math.ceil(filtered.length / 15));
  const current = Math.min(page, pages - 1);
  const update = (setter) => (e) => { setter(e.target.value); setPage(0); };
  return <section className="panel">
    <div className="panel-heading"><div><span className="eyebrow">CONTROL DE EXISTENCIAS</span><h2>Visibilidad en cada ubicación.</h2></div><button className="button secondary" disabled={!filtered.length} onClick={() => downloadCsv('adventureworks-inventario.csv', [['Producto', 'ID', 'Ubicación', 'Estante', 'Compartimiento', 'Unidades'], ...filtered.map((r) => [productMap.get(r.productid)?.name || '', r.productid, r.location?.name, r.shelf, r.bin, r.quantity])])}><Download size={16} /> Exportar CSV</button></div>
    <div className="toolbar"><label className="search-field"><Search size={17} /><input aria-label="Buscar inventario" placeholder="Buscar producto en el inventario…" value={query} onChange={update(setQuery)} /></label><select aria-label="Ubicación" value={location} onChange={update(setLocation)}><option value="all">Todas las ubicaciones</option>{locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select><select aria-label="Estado de stock" value={stock} onChange={update(setStock)}><option value="all">Todos los niveles</option><option value="empty">Sin existencias</option><option value="low">De 1 a 10 unidades</option></select></div>
    <div className="table-scroll"><table className="data-table"><thead><tr><th>Producto</th><th>Ubicación</th><th>Estante / compart.</th><th className="numeric">Existencias</th><th>Disponibilidad</th></tr></thead><tbody>{filtered.slice(current * 15, current * 15 + 15).map((r) => {
      const product = productMap.get(r.productid);
      return <tr key={`${r.productid}-${r.locationid}`}><td><button className="text-button" disabled={!product} onClick={() => onInspect(product)}>{product?.name || `Producto #${r.productid}`}</button><small className="block mono">#{r.productid}</small></td><td>{r.location?.name || `Ubicación ${r.locationid}`}</td><td className="mono">{r.shelf || '—'} / {r.bin ?? '—'}</td><td className="numeric bright">{number(r.quantity)} <small>uds.</small></td><td><span className={`status-pill ${Number(r.quantity) === 0 ? 'danger' : Number(r.quantity) <= 10 ? 'warning' : ''}`}><i />{Number(r.quantity) === 0 ? 'Sin stock' : Number(r.quantity) <= 10 ? '1–10 unidades' : 'Disponible'}</span></td></tr>;
    })}</tbody></table></div>
    {!filtered.length && <div className="empty-state"><Search size={28} /><h3>Sin registros para estos filtros</h3><p>Cambia la ubicación o el nivel de existencias.</p></div>}
    <div className="table-footer"><span>{filtered.length} registros · {number(filtered.reduce((sum, r) => sum + Number(r.quantity), 0))} unidades</span><div><button className="button subtle" disabled={current === 0} onClick={() => setPage(current - 1)}>Anterior</button><span>{current + 1} / {pages}</span><button className="button subtle" disabled={current === pages - 1} onClick={() => setPage(current + 1)}>Siguiente</button></div></div>
  </section>;
}
