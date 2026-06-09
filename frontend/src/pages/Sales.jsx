import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { sales as api } from '../api';
import { toast } from 'react-toastify';

export default function Sales() {
  const { data, loading, error, refetch } = useApi(() => api.list());
  const [search, setSearch] = useState('');

  const items = data?.data ?? data ?? [];
  const filtered = items.filter(s =>
    s.medicine?.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.customer?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleRefund = async (id) => {
    if (!confirm('Process refund for this sale?')) return;
    try {
      await api.refund(id, {});
      toast.success('Refund processed.');
      refetch();
    } catch {
      toast.error('Failed to process refund.');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading sales…</div>;
  if (error)   return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Sales</h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <i className="bi bi-plus mr-2" />New Sale
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <input
            type="text"
            placeholder="Search by medicine or customer…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full max-w-sm border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                {['#','Medicine','Customer','Qty','Total','Payment','Date','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No sales found.</td></tr>
              ) : filtered.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">#{s.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{s.medicine?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{s.customer?.name ?? 'Walk-in'}</td>
                  <td className="px-4 py-3">{s.quantity}</td>
                  <td className="px-4 py-3 font-medium">UGX {Number(s.total_price ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">{s.payment_method ?? 'Cash'}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(s.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleRefund(s.id)} className="text-orange-500 hover:text-orange-700 text-xs">
                      Refund
                    </button>
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
