import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { medicines as api } from '../api';
import { toast } from 'react-toastify';

export default function Medicines() {
  const { data, loading, error, refetch } = useApi(() => api.list());
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState(null);

  const items = data?.data ?? data ?? [];
  const filtered = items.filter(m =>
    m.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id) => {
    if (!confirm('Delete this medicine?')) return;
    setDeleting(id);
    try {
      await api.remove(id);
      toast.success('Medicine deleted.');
      refetch();
    } catch {
      toast.error('Failed to delete medicine.');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading medicines…</div>;
  if (error)   return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Medicines</h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <i className="bi bi-plus mr-2" />Add Medicine
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <input
            type="text"
            placeholder="Search medicines…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full max-w-sm border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                {['Name','Category','Stock','Price','Expiry','Status','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No medicines found.</td></tr>
              ) : filtered.map(m => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{m.name}</td>
                  <td className="px-4 py-3 text-gray-500">{m.category ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`font-medium ${m.stock < 10 ? 'text-red-600' : 'text-gray-900'}`}>{m.stock}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">UGX {Number(m.selling_price ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-500">{m.expiry_date ? new Date(m.expiry_date).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      m.stock < 10 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {m.stock < 10 ? 'Low Stock' : 'In Stock'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="text-blue-600 hover:text-blue-800">
                        <i className="bi bi-pencil" />
                      </button>
                      <button
                        onClick={() => handleDelete(m.id)}
                        disabled={deleting === m.id}
                        className="text-red-500 hover:text-red-700"
                      >
                        <i className={`bi ${deleting === m.id ? 'bi-hourglass' : 'bi-trash'}`} />
                      </button>
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
