import { useState } from 'react';
import { ArrowUpRight, Download, Package, Search } from 'lucide-react';
import { downloadCsv, matchesProduct, money } from '../services/operations';

export default function Products({ products, onInspect }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('name');
  const [page, setPage] = useState(0);
  const filtered = products.filter((p) => matchesProduct(p, query)
    && (filter === 'all' || (filter === 'commercial' ? p.listprice > 0 : p.listprice === 0)))
    .sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name) : sort === 'price' ? b.listprice - a.listprice : (b.listprice - b.standardcost) - (a.listprice - a.standardcost));
  const pages = Math.max(1, Math.ceil(filtered.length / 15));
  const current = Math.min(page, pages - 1);
  const exportData = () => downloadCsv('adventureworks-productos.csv', [
    ['ID', 'Producto', 'Código', 'Color', 'Costo estándar USD', 'Precio lista USD', 'Margen unitario USD'],
    ...filtered.map((p) => [p.productid, p.name, p.productnumber, p.color, p.standardcost, p.listprice, p.listprice - p.standardcost]),
  ]);
  return <section className="panel">
    <div className="panel-heading"><div><span className="eyebrow">CATÁLOGO MAESTRO</span><h2>Todos tus productos, en un lugar.</h2></div><button className="button secondary" onClick={exportData} disabled={!filtered.length}><Download size={16} /> Exportar CSV</button></div>
    <div className="toolbar">
      <label className="search-field"><Search size={17} /><input aria-label="Buscar productos" placeholder="Nombre, código o ID del producto…" value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} /></label>
      <select aria-label="Tipo de producto" value={filter} onChange={(e) => { setFilter(e.target.value); setPage(0); }}><option value="all">Todos los productos</option><option value="commercial">Con precio de venta</option><option value="components">Sin precio de venta</option></select>
      <select aria-label="Ordenar productos" value={sort} onChange={(e) => { setSort(e.target.value); setPage(0); }}><option value="name">Nombre A–Z</option><option value="price">Mayor precio</option><option value="margin">Mayor margen unitario</option></select>
    </div>
    <div className="table-scroll"><table className="data-table"><thead><tr><th>Producto</th><th>Código</th><th>Color</th><th className="numeric">Costo</th><th className="numeric">Precio lista</th><th className="numeric">Margen / ud.</th><th>Detalle</th></tr></thead><tbody>
      {filtered.slice(current * 15, current * 15 + 15).map((p) => <tr key={p.productid}><td><div className="product-cell"><span className="product-icon"><Package size={17} /></span><div><strong>{p.name}</strong><small>#{p.productid}</small></div></div></td><td className="mono">{p.productnumber}</td><td>{p.color || 'Sin especificar'}</td><td className="numeric">{money(p.standardcost)}</td><td className="numeric bright">{money(p.listprice)}</td><td className={`numeric ${p.listprice < p.standardcost ? 'negative' : 'positive'}`}>{p.listprice > 0 ? money(p.listprice - p.standardcost) : '—'}</td><td><button className="icon-button" aria-label={`Ver inventario de ${p.name}`} onClick={() => onInspect(p)}><ArrowUpRight size={18} /></button></td></tr>)}
    </tbody></table></div>
    {!filtered.length && <div className="empty-state"><Search size={28} /><h3>No encontramos productos</h3><p>Prueba otro nombre o cambia el filtro.</p></div>}
    <div className="table-footer"><span>{filtered.length} productos · Valores en USD</span><div><button className="button subtle" disabled={current === 0} onClick={() => setPage(current - 1)}>Anterior</button><span>{current + 1} / {pages}</span><button className="button subtle" disabled={current === pages - 1} onClick={() => setPage(current + 1)}>Siguiente</button></div></div>
  </section>;
}
