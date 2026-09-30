import { lazy, Suspense, useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, Box, CircleAlert, Layers3, Menu, Package, RefreshCw, Warehouse, X } from 'lucide-react';
import { supabase } from './supabaseClient';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import Products from './components/Products';
import Inventory from './components/Inventory';
import InventoryPanel from './components/InventoryPanel';
import WorkOrders from './components/WorkOrders';
import { loadInventory, loadProducts, number, summarize } from './services/operations';

const Analytics = lazy(() => import('./components/Analytics'));
const titles = {
  dashboard: ['VISIÓN GENERAL', 'Panel de Control de Producción', 'Cada decisión comienza con una operación visible.'],
  products: ['CATÁLOGO', 'Productos', 'Explora referencias, compara precios y consulta sus existencias.'],
  inventory: ['ALMACENAMIENTO', 'Inventario', 'El producto correcto. En el lugar correcto.'],
  analytics: ['INTELIGENCIA OPERATIVA', 'Analítica', 'Convierte el catálogo y las existencias en información útil.'],
  workorders: ['PLANIFICACIÓN', 'Órdenes de trabajo', 'Organiza la producción y registra las próximas órdenes.'],
};

function Workspace({ session }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [updatedAt, setUpdatedAt] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [selected, setSelected] = useState(null);
  const [logoutError, setLogoutError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.allSettled([loadProducts(supabase), loadInventory(supabase)]).then(([catalog, stock]) => {
      if (!active) return;
      setProducts(catalog.status === 'fulfilled' ? catalog.value : []);
      setInventory(stock.status === 'fulfilled' ? stock.value : []);
      setErrors({ products: catalog.status === 'rejected' ? catalog.reason.message : '', inventory: stock.status === 'rejected' ? stock.reason.message : '' });
      setUpdatedAt(new Date());
      setLoading(false);
    });
    return () => { active = false; };
  }, [refresh]);

  useEffect(() => {
    if (!mobileOpen) return;
    const close = (event) => { if (event.key === 'Escape') setMobileOpen(false); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [mobileOpen]);

  const navigate = (tab) => { setActiveTab(tab); setMobileOpen(false); };
  const stats = summarize(products, inventory);
  const hasErrors = Boolean(errors.products || errors.inventory);
  const title = titles[activeTab];
  const refreshData = () => { setLoading(true); setRefresh((value) => value + 1); };
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) { setLogoutError(error.message); }
  };
  return <div className="app-shell">
    <a className="skip-link" href="#workspace-content">Ir al contenido</a>
    <Sidebar activeTab={activeTab} setActiveTab={navigate} user={session.user} isMobileOpen={mobileOpen} setIsMobileOpen={setMobileOpen} onLogout={logout} />
    <main className="workspace" id="workspace-content">
      <header className="topbar"><div className="breadcrumb"><button className="icon-button mobile-toggle" aria-label="Abrir menú" onClick={() => setMobileOpen(true)}><Menu size={20} /></button><span>Workspace</span><span>/</span><strong>{title[0].charAt(0) + title[0].slice(1).toLowerCase()}</strong></div><div className="topbar-right"><span className={`connection ${hasErrors ? 'connection-error' : ''}`}><i />{loading ? 'Consultando datos' : hasErrors ? 'Revisar conexión' : 'Datos actualizados'}</span><span className="avatar">{session.user.email?.slice(0, 2).toUpperCase() || 'AW'}</span></div></header>
      <div className="workspace-content">
        <div className="page-heading"><div><p className="eyebrow">ADVENTUREWORKS / {title[0]}</p><h1>{title[1]}</h1><p className="subtitle">{title[2]}</p></div><button className="button secondary" disabled={loading} onClick={refreshData}><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Actualizar datos</button></div>
        {logoutError && <p className="error-banner" role="alert">No se pudo cerrar sesión: {logoutError}</p>}
        {hasErrors && <div role="alert" className="error-banner"><CircleAlert size={19} /><div><strong>No se pudieron consultar todos los datos.</strong>{errors.products && <p>Productos: {errors.products}</p>}{errors.inventory && <p>Inventario: {errors.inventory}</p>}<button className="text-button" onClick={refreshData}>Volver a intentar</button></div></div>}
        {loading ? <div className="loading-state" role="status"><RefreshCw className="animate-spin" size={26} /><h2>Preparando tu espacio de trabajo</h2><p>Consultando catálogo y existencias…</p></div> : <>
          {activeTab === 'dashboard' && <>
            <section className="overview-banner"><div><span className="banner-label"><span className="live-dot" /> CENTRO DE OPERACIONES</span><h2>Tu producción.<br /><em>Bajo control.</em></h2><p>Del catálogo al almacén y a la próxima orden.<br className="desktop-only" /> Todo tu flujo de trabajo, conectado.</p><button className="button primary" onClick={() => navigate('workorders')}>Gestionar órdenes <ArrowUpRight size={18} /></button></div><div className="operations-visual" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="core-mark"><Layers3 size={54} strokeWidth={1.2} /></div><span className="orbital-label label-one"><Package size={15} /> CATÁLOGO</span><span className="orbital-label label-two"><Warehouse size={15} /> INVENTARIO</span><span className="orbital-label label-three"><Box size={15} /> PRODUCCIÓN</span><span className="coordinate mono">AW / OPERATIONS SYSTEM</span></div></section>
            <div className="metrics-grid">{[
              ['Referencias en catálogo', errors.products ? '—' : number(stats.totalProducts), 'Productos y componentes', Package],
              ['Unidades en inventario', errors.inventory ? '—' : number(stats.totalUnits), 'Suma de todas las ubicaciones', Layers3],
              ['Ubicaciones con stock registrado', errors.inventory ? '—' : number(stats.locations.length), 'Centros con registros de inventario', Warehouse],
              ['Registros sin existencias', errors.inventory ? '—' : number(stats.empty), 'Combinaciones producto / ubicación', CircleAlert],
            ].map(([label, value, hint, Icon], index) => <article className="metric-card" key={label}><div><span>{label}</span><Icon size={18} /></div><strong>{value}</strong><small><span className={index === 3 ? 'amber-dot' : 'metric-dot'} />{hint}</small></article>)}</div>
            {!hasErrors && <Suspense fallback={<div className="panel loading-state">Cargando gráficos…</div>}><Analytics stats={stats} compact /></Suspense>}
            <div className="quick-links">{[['products', '01', 'Explorar catálogo', 'Referencias, precios y costos.'], ['inventory', '02', 'Consultar inventario', 'Existencias por centro y producto.'], ['analytics', '03', 'Analizar la operación', 'Distribución de stock y márgenes.']].map(([tab, id, label, note]) => <button key={tab} onClick={() => navigate(tab)}><span className="mono">{id}</span><div><strong>{label}</strong><small>{note}</small></div><ArrowRight size={18} /></button>)}</div>
          </>}
          {activeTab === 'products' && !errors.products && <Products products={products} onInspect={setSelected} />}
          {activeTab === 'inventory' && !errors.inventory && !errors.products && <Inventory inventory={inventory} products={products} locations={stats.locations} onInspect={setSelected} />}
          {activeTab === 'analytics' && !hasErrors && <Suspense fallback={<div className="panel loading-state">Cargando gráficos…</div>}><Analytics stats={stats} /></Suspense>}
          {activeTab === 'workorders' && !errors.products && <WorkOrders key={refresh} products={products} />}
        </>}
        <footer className="workspace-footer"><span><Layers3 size={13} /> AdventureWorks · Control de producción</span><span>{updatedAt ? `Última consulta: ${updatedAt.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}` : 'Esperando datos'} {hasErrors ? '· con errores' : ''}</span></footer>
      </div>
    </main>
    {selected && <InventoryPanel key={selected.productid} product={selected} isOpen onClose={() => setSelected(null)} />}
  </div>;
}

export default function App() {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data, error: authError }) => {
      if (!active) return;
      if (authError) setError(authError.message);
      setSession(data.session);
      setChecking(false);
    }).catch(() => { if (active) { setError('No se pudo recuperar la sesión. Inicia sesión de nuevo.'); setChecking(false); } });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) { setSession(nextSession); setChecking(false); }
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);
  if (checking) return <div className="loading-state full-screen"><Layers3 size={32} /><p>Abriendo AdventureWorks…</p></div>;
  if (!session) return <>{error && <div className="error-banner" role="alert">{error}<button className="icon-button" aria-label="Cerrar aviso" onClick={() => setError('')}><X size={16} /></button></div>}<Auth /></>;
  return <Workspace key={session.user.id} session={session} />;
}
