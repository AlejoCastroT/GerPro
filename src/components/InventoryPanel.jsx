import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { X, Warehouse, AlertTriangle, CheckCircle2, Layers, MapPin } from 'lucide-react';

export default function InventoryPanel({ product, isOpen, onClose }) {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && product?.productid) {
      fetchInventory(product.productid);
    }
  }, [isOpen, product]);

  async function fetchInventory(productId) {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('productinventory')
        .select(`
          quantity,
          shelf,
          bin,
          location (
            locationid,
            name
          )
        `)
        .eq('productid', productId);

      if (error) throw error;
      setInventory(data || []);
    } catch (err) {
      console.error('Error al obtener inventario:', err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen || !product) return null;

  const totalStock = inventory.reduce((acc, curr) => acc + (curr.quantity || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl shadow-black/80 flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Warehouse size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">{product.name}</h2>
              <p className="text-xs text-slate-400 font-mono">Código: {product.productnumber} • ID: #{product.productid}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Resumen Superior */}
        <div className="grid grid-cols-2 gap-3 my-4">
          <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
            <span className="text-[11px] text-slate-500 block">Stock Total Registrado</span>
            <span className={`text-xl font-bold font-mono ${totalStock === 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {totalStock} uds
            </span>
          </div>
          <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
            <span className="text-[11px] text-slate-500 block">Centros / Ubicaciones</span>
            <span className="text-xl font-bold font-mono text-slate-200">
              {inventory.length}
            </span>
          </div>
        </div>

        {/* Lista de Ubicaciones */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {loading ? (
            <div className="text-center py-8 text-xs text-slate-500">Cargando ubicaciones de stock...</div>
          ) : inventory.length === 0 ? (
            <div className="text-center py-8 bg-slate-950/40 rounded-xl border border-slate-800/60 p-4">
              <AlertTriangle className="mx-auto text-amber-400 mb-2" size={24} />
              <p className="text-xs text-slate-400">Este producto no cuenta con registros de inventario asignados.</p>
            </div>
          ) : (
            inventory.map((item, idx) => {
              const qty = item.quantity || 0;
              const isZero = qty === 0;

              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between transition-colors ${
                    isZero
                      ? 'bg-red-500/5 border-red-500/20'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${isZero ? 'bg-red-500/10 text-red-400' : 'bg-slate-800 text-slate-300'}`}>
                      <MapPin size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-200">
                        {item.location?.name || 'Ubicación General'}
                      </h4>
                      <p className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <Layers size={12} />
                        <span>Estante: {item.shelf || 'N/A'}</span>
                        <span>•</span>
                        <span>Compartimiento: {item.bin || 'N/A'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Alerta Visual de Cantidad */}
                  <div className="text-right">
                    {isZero ? (
                      <div className="flex items-center gap-1.5 text-red-400">
                        <AlertTriangle size={14} />
                        <span className="text-xs font-bold font-mono">0 (Sin Stock)</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-emerald-400">
                        <CheckCircle2 size={14} />
                        <span className="text-xs font-bold font-mono">{qty} uds</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Modal */}
        <div className="pt-4 mt-2 border-t border-slate-800 text-right">
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-4 py-2 rounded-xl transition"
          >
            Cerrar Panel
          </button>
        </div>
      </div>
    </div>
  );
}