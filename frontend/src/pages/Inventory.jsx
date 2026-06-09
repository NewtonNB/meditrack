import { useApi } from '../hooks/useApi';
import { inventory as api } from '../api';

export default function Inventory() {
  const { data, loading, error } = useApi(() => api.get());
  const summary = data?.summary ?? data ?? {};

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading inventory…</div>;
  if (error)   return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Items',    value: summary.total_medicines ?? 0,    icon: 'bi-boxes',             color: 'bg-blue-500' },
          { label: 'Low Stock',      value: summary.low_stock_count ?? 0,    icon: 'bi-exclamation-circle', color: 'bg-red-500'  },
          { label: 'Expiring Soon',  value: summary.expiring_soon_count ?? 0,icon: 'bi-clock',              color: 'bg-yellow-500'},
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className={`w-12 h-12 ${c.color} rounded-xl flex items-center justify-center`}>
              <i className={`bi ${c.icon} text-white text-xl`} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{c.label}</p>
              <p className="text-2xl font-bold text-gray-900">{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <p className="text-gray-500 text-sm">Use the Stock Movements section to add, remove, or transfer stock between warehouses.</p>
      </div>
    </div>
  );
}
