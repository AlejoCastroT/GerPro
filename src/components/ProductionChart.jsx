import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function ProductionChart({ data }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6 shadow-xl">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-100">Top 10 Productos por Precio de Lista</h2>
        <p className="text-xs text-slate-400">Comparativa de valor comercial de la línea de bicicletas</p>
      </div>

      <div className="h-72 w-full min-h-70">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="#94a3b8" 
              fontSize={11} 
              tickLine={false}
              tickFormatter={(value) => (value && value.length > 12 ? `${value.substring(0, 12)}...` : value)}
            />
            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
              formatter={(value) => [`$${value}`, 'Precio Lista']}
            />
            <Bar dataKey="listprice" fill="#10b981" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}