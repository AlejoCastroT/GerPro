import { DollarSign, PackageCheck, AlertTriangle, Activity } from 'lucide-react';

export default function KPICards({ stats }) {
  const cards = [
    {
      title: 'Productos Comerciales',
      value: stats.totalProducts,
      icon: PackageCheck,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
    },
    {
      title: 'Precio Promedio',
      value: `$${stats.avgPrice.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
    },
    {
      title: 'Producto Más Costoso',
      value: `$${stats.maxPrice.toFixed(2)}`,
      icon: Activity,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
    },
    {
      title: 'Estado Servidor BD',
      value: 'Online 100%',
      icon: AlertTriangle,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`p-5 rounded-2xl bg-slate-900 border ${card.borderColor} flex items-center justify-between shadow-lg shadow-black/20`}
          >
            <div>
              <p className="text-xs font-medium text-slate-400 mb-1">{card.title}</p>
              <h3 className="text-2xl font-bold text-slate-100">{card.value}</h3>
            </div>
            <div className={`p-3 rounded-xl ${card.bgColor} ${card.color}`}>
              <Icon size={22} />
            </div>
          </div>
        );
      })}
    </div>
  );
}