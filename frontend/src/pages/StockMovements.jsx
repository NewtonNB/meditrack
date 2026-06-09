import { useApi } from '../hooks/useApi';
import { stockMovements as api } from '../api';

export default function StockMovements() {
  const { data, loading, error } = useApi(() => api.list());
  const items = data?.data ?? data ?? [];

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading stock movements…</div>;
  if (error)   return <div className="text-red-500 p-4">{error}</div>;

  const typeColors = { in: 'bg-green-100 text-green-700', out: 'bg-red-100 text-red-700', adjustment: 'bg-yellow-100 text-yellow-700', transfer: 'bg-blue-100 text-blue-700' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Stock Movements</h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <i className="bi bi-plus mr-2" />Add Movement
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              {['Medicine','Type','Quantity','Reason','Date'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No stock movements found.</td></tr>
            ) : items.map(m => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{m.medicine?.name ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColors[m.type] ?? 'bg-gray-100 text-gray-600'}`}>{m.type}</span>
                </td>
                <td className="px-4 py-3">{m.quantity}</td>
                <td className="px-4 py-3 text-gray-500">{m.reason ?? '—'}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(m.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
