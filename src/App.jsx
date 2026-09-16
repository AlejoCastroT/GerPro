import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import Sidebar from './components/Sidebar';
import KPICards from './components/KPICards';
import ProductionChart from './components/ProductionChart';
import Auth from './components/Auth';
import InventoryPanel from './components/InventoryPanel';
import { RefreshCw, Search, Menu, Wrench } from 'lucide-react';
import WorkOrders from './components/WorkOrders';

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
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [stats, setStats] = useState({ totalProducts: 0, avgPrice: 0, maxPrice: 0 });

  // Estados para el Modal de Inventario (HU-02)
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  useEffect(() => {
    if (session) {
      loadData();
    }
  }, [session]);

  async function loadData() {
    try {
      setLoading(true);
      
      // Traemos un conjunto más amplio de productos comerciales
      const { data, error } = await supabase
        .from('product')
        .select('productid, name, productnumber, listprice, standardcost, color')
        .gt('listprice', 0)
        .order('productid', { ascending: true })
        .limit(250);

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

  const handleOpenInventory = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <RefreshCw size={32} className="animate-spin text-emerald-400 mb-3" />
        <p className="text-xs">Verificando sesión segura...</p>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  // Búsqueda inteligente por ID, Código o Nombre
  const filteredProducts = (products || []).filter(p => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    
    return (
      String(p.productid).includes(term) ||
      p.name?.toLowerCase().includes(term) ||
      p.productnumber?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Sidebar Responsivo */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={session.user} 
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Area */}
      <main className="flex-1 flex flex-col overflow-y-auto min-w-0">
        {/* Header */}
        <header className="h-16 bg-slate-900/50 border-b border-slate-800 px-4 md:px-6 flex items-center justify-between sticky top-0 backdrop-blur-md z-10 gap-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden text-slate-300 hover:text-white p-2 rounded-xl bg-slate-800 border border-slate-700"
            >
              <Menu size={18} />
            </button>

            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl w-48 sm:w-64 md:w-80">
              <Search size={16} className="text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Buscar por ID, código o nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent text-xs text-slate-200 outline-none w-full placeholder:text-slate-500"
              />
            </div>
          </div>

          <button
            onClick={loadData}
            className="flex items-center gap-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl transition border border-slate-700 shrink-0"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-emerald-400' : ''} />
            <span className="hidden sm:inline">Actualizar Datos</span>
          </button>
        </header>

        {/* Renderizado Dinámico de Vistas */}
        <div className="p-4 md:p-6 max-w-7xl w-full mx-auto space-y-6">
          
          {/* VISTA 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-100">Panel de Control de Producción</h1>
                <p className="text-xs text-slate-400">Sincronización en tiempo real con Supabase</p>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center h-64 space-y-3">
                  <RefreshCw size={32} className="animate-spin text-emerald-400" />
                  <p className="text-slate-400 text-sm font-medium">Cargando base de datos...</p>
                </div>
              ) : (
                <>
                  {/* Tarjetas de Métricas */}
                  <KPICards stats={stats} />
                  
                  {/* Gráficos */}
                  {products.length > 0 && <ProductionChart data={products.slice(0, 8)} />}

                  {/* Tabla de Productos con trigger modal */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-base md:text-lg font-bold text-slate-100">Catálogo de Productos ({filteredProducts.length})</h2>
                        <p className="text-[11px] text-slate-400">Haz clic en cualquier fila para consultar el inventario por ubicación</p>
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto max-h-[500px]">
                      <table className="w-full text-left text-xs min-w-[600px]">
                        <thead className="text-slate-400 border-b border-slate-800 uppercase bg-slate-950/80 sticky top-0 backdrop-blur-md">
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
                          {filteredProducts.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="text-center py-8 text-slate-500">
                                No se encontraron productos que coincidan con la búsqueda.
                              </td>
                            </tr>
                          ) : (
                            filteredProducts.map((p) => {
                              const margin = p.listprice - p.standardcost;

                              return (
                                <tr 
                                  key={p.productid} 
                                  onClick={() => handleOpenInventory(p)}
                                  className="hover:bg-slate-800/60 transition-colors cursor-pointer group"
                                >
                                  <td className="p-3 font-mono text-slate-500 group-hover:text-emerald-400">#{p.productid}</td>
                                  <td className="p-3 font-semibold text-slate-200 group-hover:text-white">{p.name}</td>
                                  <td className="p-3 font-mono text-slate-400">{p.productnumber}</td>
                                  <td className="p-3 text-slate-400">${p.standardcost.toFixed(2)}</td>
                                  <td className="p-3 font-semibold text-emerald-400">${p.listprice.toFixed(2)}</td>
                                  <td className="p-3 text-right font-mono text-purple-400 font-medium">
                                    +${margin.toFixed(2)}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* VISTA 2: ÓRDENES DE TRABAJO (HU-03) */}
          {activeTab === 'workorders' && (
            <WorkOrders products={products} />
          )}

          {/* VISTA 3: PESTAÑAS EN DESARROLLO (Mensaje para las demás opciones del menú) */}
          {['products', 'inventory', 'analytics'].includes(activeTab) && (
            <div className="flex flex-col items-center justify-center h-[60vh] border border-dashed border-slate-800 rounded-3xl bg-slate-900/30">
              <Wrench size={48} className="text-slate-700 mb-4" />
              <h2 className="text-lg font-bold text-slate-300">Módulo en Construcción</h2>
              <p className="text-slate-500 text-sm mt-1">Esta sección estará disponible próximamente.</p>
            </div>
          )}

        </div>
      </main>

      {/* Modal de Control de Inventario (HU-02) */}
      <InventoryPanel 
        product={selectedProduct} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}