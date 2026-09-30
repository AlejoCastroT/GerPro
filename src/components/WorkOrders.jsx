import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { createWorkOrder, listWorkOrders } from '../services/workOrders';
import { Plus, X, Wrench, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function WorkOrders({ products }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estados del Formulario
  const [productId, setProductId] = useState('');
  const [orderQty, setOrderQty] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState('');
  const submitLock = useRef(false);

  useEffect(() => {
    let active = true;
    listWorkOrders(supabase).then((data) => {
      if (active) setOrders(data);
    }).catch((err) => {
      if (active) setLoadError('No se pudieron cargar las órdenes: ' + err.message);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitLock.current) return;
    setFormError('');
    setFormSuccess('');

    try {
      submitLock.current = true;
      setSubmitting(true);
      const order = await createWorkOrder(supabase, { productId, orderQty, startDate, endDate });
      setOrders((current) => [order, ...current].slice(0, 20));
      setFormSuccess('¡Orden de trabajo registrada exitosamente!');
      setIsModalOpen(false);
      setProductId('');
      setOrderQty('');
      setStartDate('');
      setEndDate('');
    } catch (err) {
      setFormError('Error al guardar: ' + err.message);
    } finally {
      submitLock.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header del módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-medium text-slate-100 flex items-center gap-2">
            <Wrench className="text-emerald-400" />
            Órdenes recientes
          </h2>
          <p className="text-xs text-slate-400 mt-1">Las últimas 20 órdenes registradas, de la más reciente a la más antigua.</p>
        </div>
        <button
          disabled={loading}
          onClick={() => { setFormError(''); setFormSuccess(''); setIsModalOpen(true); }}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
        >
          <Plus size={16} />
          Nueva Orden
        </button>
      </div>

      {loadError && <p role="alert" className="text-red-400 text-sm">{loadError}</p>}
      {formSuccess && <p role="status" className="text-emerald-400 text-sm"><CheckCircle2 className="inline mr-2" size={16} />{formSuccess}</p>}
      {/* Tabla de Órdenes */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-xl overflow-x-auto">
        {loading ? (
          <div className="text-center py-10 text-slate-500 text-sm">Cargando órdenes...</div>
        ) : (
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="text-slate-400 border-b border-slate-800 uppercase bg-slate-950/50">
              <tr>
                <th className="p-3">ID Orden</th>
                <th className="p-3">Producto</th>
                <th className="p-3 text-right">Cant. Ordenada</th>
                <th className="p-3 text-center">F. Inicio</th>
                <th className="p-3 text-center">F. Fin</th>
                <th className="p-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-500">{loadError ? 'Listado no disponible.' : 'No hay órdenes registradas.'}</td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.workorderid} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-mono text-emerald-400 font-medium">WO-{o.workorderid}</td>
                    <td className="p-3 font-semibold text-slate-200">{o.product?.name || 'Desconocido'}</td>
                    <td className="p-3 font-mono text-right">{o.orderqty} uds</td>
                    <td className="p-3 font-mono text-slate-400 text-center">{o.startdate?.slice(0, 10) || '—'}</td>
                    <td className="p-3 font-mono text-slate-400 text-center">{o.enddate?.slice(0, 10) || '—'}</td>
                    <td className="p-3 text-center">
                      <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-lg text-[10px] font-bold border border-emerald-500/20">
                        Programada
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de Nueva Orden (Formulario CRUD) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div role="dialog" aria-modal="true" aria-labelledby="order-title" className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 id="order-title" className="text-lg font-bold text-slate-100">Registrar Orden</h2>
              <button aria-label="Cerrar formulario" disabled={submitting} onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition">
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div role="alert" className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-400 text-xs">
                <AlertCircle size={16} className="shrink-0" /> {formError}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="order-product" className="block text-xs font-medium text-slate-400 mb-1">Producto a ensamblar</label>
                <select
                  id="order-product"
                  disabled={submitting}
                  required
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-emerald-500/50"
                >
                  <option value="">Seleccione un producto...</option>
                  {products.map(p => (
                    <option key={p.productid} value={p.productid}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="order-qty" className="block text-xs font-medium text-slate-400 mb-1">Cantidad Ordenada (OrderQty)</label>
                <input
                  id="order-qty"
                  disabled={submitting}
                  step="1"
                  max="2147483647"
                  type="number"
                  required
                  min="1"
                  value={orderQty}
                  onChange={(e) => setOrderQty(e.target.value)}
                  placeholder="Ej: 100"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="order-start" className="block text-xs font-medium text-slate-400 mb-1">Fecha de Inicio</label>
                  <input
                    id="order-start"
                    disabled={submitting}
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-400 outline-none focus:border-emerald-500/50 [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label htmlFor="order-end" className="block text-xs font-medium text-slate-400 mb-1">Fecha de Fin</label>
                  <input
                    id="order-end"
                    disabled={submitting}
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-400 outline-none focus:border-emerald-500/50 [color-scheme:dark]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {submitting ? 'Guardando...' : 'Guardar Orden de Trabajo'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
