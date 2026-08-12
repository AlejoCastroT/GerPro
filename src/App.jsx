import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import Sidebar from './components/Sidebar';
import KPICards from './components/KPICards';
import ProductionChart from './components/ProductionChart';
import Auth from './components/Auth';
import { RefreshCw, Search } from 'lucide-react';

const parseMoney = (value) => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  const cleanString = String(value).replace(/[^0-9.-]+/g, '');
  const parsed = parseFloat(cleanString);
  return isNaN(parsed) ? 0 : parsed;
};

export default function App() {
  const [session, setSession] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ totalProducts: 0, avgPrice: 0, maxPrice: 0 });

  // 1. Escuchador de autenticación con JWT Persistente
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthChecking(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAuthChecking(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Carga de datos de producción cuando hay sesión activa
  useEffect(() => {
    if (session) {
      loadData();
    }
  }, [session]);

  async function loadData() {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('product')
        .select('productid, name, productnumber, listprice, standardcost, color')
        .gt('listprice', 0)
        .order('listprice', { ascending: false })
        .limit(20);

      if (error) throw error;

      if (data && data.length > 0) {
        const processedData = data.map(p => ({
          ...p,
          listprice: parseMoney(p.listprice),
          standardcost: parseMoney(p.standardcost)
        }));

        setProducts(processedData);
        
        const prices = processedData.map(p => p.listprice);
        const max = Math.max(...prices);
        const avg = prices.reduce((acc, curr) => acc + curr, 0) / prices.length;

        setStats({
          totalProducts: processedData.length,
          avgPrice: avg || 0,
          maxPrice: max || 0
        });
      } else {
        setProducts([]);
        setStats({ totalProducts: 0, avgPrice: 0, maxPrice: 0 });
      }
    } catch (err) {
      console.error('Error cargando datos de Supabase:', err.message);
    } finally {
      setLoading(false);
    }
  }

  // Pantalla de carga mientras se verifica el token JWT guardado
  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <RefreshCw size={32} className="animate-spin text-emerald-400 mb-3" />
        <p className="text-xs">Verificando sesión segura...</p>
      </div>
    );
  }

  // Si no hay sesión válida, muestra la vista de Login/Register
  if (!session) {
    return <Auth />;
  }

  const filteredProducts = (products || []).filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.productnumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Sidebar con información del usuario autenticado */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={session.user} />

      {/* Main Area */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Header */}
        <header className="h-16 bg-slate-900/50 border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 backdrop-blur-md z-10">
          <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl w-72">
            <Search size={16} className="text-slate-400" />
            <input
              type="text"
              placeholder="Buscar producto o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-xs text-slate-200 outline-none w-full placeholder:text-slate-500"
            />
          </div>

          <button
            onClick={loadData}
            className="flex items-center gap-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl transition border border-slate-700"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-emerald-400' : ''} />
            Actualizar Datos
          </button>
        </header>

        {/* Dashboard Content */}
        <div className="p-6 max-w-7xl w-full mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Panel de Control de Producción</h1>
            <p className="text-xs text-slate-400">Sincronización en tiempo real con Supabase</p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-3">
              <RefreshCw size={32} className="animate-spin text-emerald-400" />
              <p className="text-slate-400 text-sm font-medium">Cargando base de datos...</p>
            </div>
          ) : (
            <>
              <KPICards stats={stats} />
              
              {products.length > 0 && <ProductionChart data={products.slice(0, 8)} />}

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <h2 className="text-lg font-bold text-slate-100 mb-4">Catálogo de Productos Destacados</h2>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="text-slate-400 border-b border-slate-800 uppercase bg-slate-950/50">
                      <tr>
                        <th className="p-3">ID</th>
                        <th className="p-3">Nombre</th>
                        <th className="p-3">Código</th>
                        <th className="p-3">Costo Estándar</th>
                        <th className="p-3">Precio Lista</th>
                        <th className="p-3 text-right">Margen Bruto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredProducts.map((p) => {
                        const margin = p.listprice - p.standardcost;

                        return (
                          <tr key={p.productid} className="hover:bg-slate-800/40 transition-colors">
                            <td className="p-3 font-mono text-slate-500">#{p.productid}</td>
                            <td className="p-3 font-semibold text-slate-200">{p.name}</td>
                            <td className="p-3 font-mono text-slate-400">{p.productnumber}</td>
                            <td className="p-3 text-slate-400">${p.standardcost.toFixed(2)}</td>
                            <td className="p-3 font-semibold text-emerald-400">${p.listprice.toFixed(2)}</td>
                            <td className="p-3 text-right font-mono text-purple-400 font-medium">
                              +${margin.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}