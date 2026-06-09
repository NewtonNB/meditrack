import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { purchases as api } from '../api';
import { toast } from 'react-toastify';

export default function Purchases() {
  const { data, loading, error, refetch } = useApi(() => api.list());
  const [search, setSearch] = useState('');

  const items = data?.data ?? data ?? [];
  const filtered = items.filter(p =>
    p.supplier?.name?.toLowerCase().includes(search.toLowerCase()) ||
    String(p.id).includes(search)
  );

  const handleCancel = async (id) => {
    if (!confirm('Cancel this purchase?')) return;
    try {
      await api.cancel(id);
      toast.success('Purchase cancelled.');
      refetch();
    } catch {
      toast.error('Failed to cancel purchase.');
    }
  };

  const statusColors = {
    pending:   'bg-yellow-100 text-yellow-700',
    ordered:   'bg-blue-100 text-blue-700',
    received:  'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading purchases…</div>;
  if (error)   return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Purchases</h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <i className="bi bi-plus mr-2" />New Purchase
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <input
            type="text"
            placeholder="Search by supplier or ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full max-w-sm border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                {['#','Supplier','Total Cost','Status','Date','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No purchases found.</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">#{p.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{p.supplier?.name ?? '—'}</td>
                  <td className="px-4 py-3">UGX {Number(p.total_cost ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[p.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="text-blue-600 hover:text-blue-800 text-xs">View</button>
                      {p.status === 'pending' && (
                        <button onClick={() => handleCancel(p.id)} className="text-red-500 hover:text-red-700 text-xs">
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
