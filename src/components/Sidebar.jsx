import { LayoutDashboard, Package, Wrench, Warehouse, BarChart3, LogOut, X, Layers3, ArrowUpRight } from 'lucide-react';

const items = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'products', label: 'Productos', icon: Package },
  { id: 'workorders', label: 'Órdenes Trabajo', icon: Wrench },
  { id: 'inventory', label: 'Inventario', icon: Warehouse },
  { id: 'analytics', label: 'Analítica', icon: BarChart3 },
];

export default function Sidebar({ activeTab, setActiveTab, user, isMobileOpen, setIsMobileOpen, onLogout }) {
  return <>
    {isMobileOpen && <button className="sidebar-backdrop" aria-label="Cerrar navegación" onClick={() => setIsMobileOpen(false)} />}
    <aside className={`sidebar ${isMobileOpen ? 'sidebar-open' : ''}`}>
      <div className="brand"><span className="brand-mark"><Layers3 size={24} /></span><div><strong>Adventure<span>Works</span></strong><small>OPERATIONS PLATFORM</small></div><button className="icon-button mobile-toggle" aria-label="Cerrar menú" onClick={() => setIsMobileOpen(false)}><X size={18} /></button></div>
      <div className="workspace-label"><span className="workspace-symbol">AW</span><div><strong>Control de producción</strong><small>Espacio de trabajo</small></div></div>
      <p className="nav-label">OPERACIÓN</p>
      <nav aria-label="Navegación principal">{items.map(({ id, label, icon: Icon }) => <button key={id} aria-current={activeTab === id ? 'page' : undefined} onClick={() => setActiveTab(id)} className={`nav-item ${activeTab === id ? 'active' : ''}`}><Icon size={19} /><span>{label}</span>{activeTab === id && <span className="nav-indicator" />}</button>)}</nav>
      <div className="sidebar-bottom"><div className="sidebar-tip"><Layers3 size={20} /><strong>Una operación conectada.</strong><p>Consulta existencias antes de planificar tu próxima orden.</p><button onClick={() => setActiveTab('inventory')}>Ver inventario <ArrowUpRight size={15} /></button></div><div className="user-profile"><span className="avatar">{user?.email?.slice(0, 2).toUpperCase() || 'OP'}</span><div><strong>{user?.user_metadata?.full_name || 'Operador'}</strong><small>{user?.email}</small></div><button className="icon-button" onClick={onLogout} aria-label="Cerrar Sesión" title="Cerrar Sesión"><LogOut size={17} /></button></div></div>
    </aside>
  </>;
}
