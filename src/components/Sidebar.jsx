import { LayoutDashboard, Package, Wrench, Warehouse, Settings, BarChart3, LogOut } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function Sidebar({ activeTab, setActiveTab, user }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Productos', icon: Package },
    { id: 'workorders', label: 'Órdenes Trabajo', icon: Wrench },
    { id: 'inventory', label: 'Inventario', icon: Warehouse },
    { id: 'analytics', label: 'Analítica', icon: BarChart3 },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between p-4 shrink-0">
      <div>
        <div className="flex items-center gap-3 px-3 py-4 mb-6 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xl">
            AW
          </div>
          <div>
            <h1 className="font-bold text-slate-100 text-sm leading-tight">AdventureWorks</h1>
            <span className="text-xs text-slate-400">Módulo Producción</span>
          </div>
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-slate-800 pt-4 px-3 flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-emerald-400 shrink-0">
            {user?.email?.substring(0, 2).toUpperCase() || 'OP'}
          </div>
          <div className="text-xs truncate">
            <p className="font-medium text-slate-200 truncate">{user?.user_metadata?.full_name || 'Operador'}</p>
            <p className="text-slate-500 truncate text-[10px]">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          title="Cerrar Sesión"
          className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-900 transition"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}