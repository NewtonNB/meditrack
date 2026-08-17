import { useState } from 'react';
import { useApi, getListItems } from '../hooks/useApi';
import { stockMovements as api } from '../api';
import { useNavigate } from 'react-router-dom';
import PermissionGate from '../Components/PermissionGate';
import StockMovementModal from '../Components/StockMovementModal';

const TYPE_COLORS = {
  in:         'bg-green-100 text-green-700',
  out:        'bg-red-100 text-red-700',
  adjustment: 'bg-yellow-100 text-yellow-700',
  transfer:   'bg-blue-100 text-blue-700',
};

export default function StockMovements() {
  const navigate = useNavigate();
  const [page,       setPage]       = useState(1);
  const [perPage]                   = useState(15);
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFrom,   setDateFrom]   = useState('');
  const [dateTo,     setDateTo]     = useState('');
  const [modalOpen,  setModalOpen]  = useState(false);

  const params = {
    page,
    per_page: perPage,
    ...(typeFilter && { type: typeFilter }),
    ...(dateFrom   && { date_from: dateFrom }),
    ...(dateTo     && { date_to: dateTo }),
  };

  const { data, loading, error, refetch } = useApi(
    () => api.list(params),
    [page, perPage, typeFilter, dateFrom, dateTo]
  );

  const items       = getListItems(data);
  const total       = data?.total ?? items.length;
  const currentPage = data?.current_page ?? 1;
  const lastPage    = data?.last_page ?? 1;

  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
            <i className="bi bi-arrow-left" /> Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Stock Movements</h1>
        </div>
        <PermissionGate permission="manage_medicines">
          <button onClick={() => setModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
            <i className="bi bi-plus" /> Add Movement
          </button>
        </PermissionGate>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Type</label>
            <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Types</option>
              <option value="in">In</option>
              <option value="out">Out</option>
              <option value="adjustment">Adjustment</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">From</label>
            <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">To</label>
            <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {(typeFilter || dateFrom || dateTo) && (
            <button onClick={() => { setTypeFilter(''); setDateFrom(''); setDateTo(''); setPage(1); }}
              className="text-sm text-blue-600 hover:underline">Clear</button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              {['Medicine', 'Type', 'Quantity', 'Reason', 'Reference', 'Date'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  {[1,2,3,4,5,6].map(c => (
                    <td key={c} className="px-4 py-3"><div className="skeleton-shimmer h-3 rounded w-full" /></td>
                  ))}
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">No stock movements found.</td></tr>
            ) : items.map(m => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{m.medicine?.name ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${TYPE_COLORS[m.type] ?? 'bg-gray-100 text-gray-600'}`}>
                    {m.type}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium">{m.quantity}</td>
                <td className="px-4 py-3 text-gray-500">{m.reason ?? '—'}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{m.reference ?? '—'}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(m.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {items.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <span>Page {currentPage} of {lastPage} · {total} total movement{total !== 1 ? 's' : ''}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1}
                className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40">Previous</button>
              <button onClick={() => setPage(p => Math.min(lastPage, p + 1))} disabled={currentPage >= lastPage}
                className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      <StockMovementModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={refetch}
      />
    </div>
  );
}
