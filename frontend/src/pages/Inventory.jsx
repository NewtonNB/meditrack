import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { inventory as api } from '../api';
import PermissionGate from '../Components/PermissionGate';

export default function Inventory() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('cards');
  const [search, setSearch] = useState('');
  const { data, loading, error, refetch } = useApi(() => api.get(), []);
  const summary = data?.summary ?? data ?? {};
  const lowStockItems = Array.isArray(data?.lowStockItems) ? data.lowStockItems : [];
  const expiringBatches = Array.isArray(data?.expiringBatches) ? data.expiringBatches : [];
  const recentMovements = Array.isArray(data?.recentMovements) ? data.recentMovements : [];
  const searchQuery = search.toLowerCase();

  const filteredLowStock = lowStockItems.filter(item =>
    item.medicine?.name?.toLowerCase().includes(searchQuery) ||
    item.medicine?.brand?.toLowerCase().includes(searchQuery) ||
    item.batch_number?.toLowerCase().includes(searchQuery)
  );

  const filteredExpiring = expiringBatches.filter(item =>
    item.medicine?.name?.toLowerCase().includes(searchQuery) ||
    item.batch_number?.toLowerCase().includes(searchQuery)
  );

  const filteredMovements = recentMovements.filter(movement =>
    movement.medicine?.name?.toLowerCase().includes(searchQuery) ||
    movement.reference?.toLowerCase().includes(searchQuery) ||
    movement.notes?.toLowerCase().includes(searchQuery)
  );

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading inventory…</div>;
  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-500 mt-1">Inventory dashboard with low stock, expiring batches, and recent movement details.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition"
          >
            <i className="bi bi-arrow-left mr-1" /> Back
          </button>
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition ${viewMode === 'cards' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Cards
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Table
          </button>
          <PermissionGate permission="manage_medicines">
            <button
              type="button"
              onClick={refetch}
              className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition"
            >
              Refresh
            </button>
          </PermissionGate>
          <PermissionGate permission="manage_medicines">
            <button
              type="button"
              onClick={() => navigate('/stock-movements')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              <i className="bi bi-plus mr-2" /> Add Movement
            </button>
          </PermissionGate>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <input
          type="text"
          placeholder="Search inventory…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-md border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Total Items',    value: summary.total_items ?? 0,      icon: 'bi-boxes',             color: 'bg-blue-500' },
          { label: 'Low Stock',      value: summary.low_stock_items ?? 0,  icon: 'bi-exclamation-circle', color: 'bg-red-500'  },
          { label: 'Expiring Soon',  value: summary.expiring_batches ?? 0, icon: 'bi-clock',              color: 'bg-yellow-500'},
          { label: 'Out of Stock',   value: summary.out_of_stock_items ?? 0, icon: 'bi-slash-circle',      color: 'bg-gray-500'},
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Low Stock Items</h2>
              <p className="text-sm text-gray-500">Items that need restocking soon.</p>
            </div>
            <span className="text-xs uppercase tracking-wide text-gray-400">{filteredLowStock.length} items</span>
          </div>
          {viewMode === 'cards' ? (
            <div className="p-4 grid gap-4 sm:grid-cols-2">
              {filteredLowStock.length === 0 ? (
                <div className="col-span-full text-center text-gray-400 py-12">No low stock items found.</div>
              ) : filteredLowStock.map(item => (
                <div key={`${item.id}-${item.batch_number}`} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">{item.medicine?.brand ?? 'Unknown brand'}</p>
                  <p className="text-lg font-semibold text-gray-900">{item.medicine?.name ?? 'Unknown medicine'}</p>
                  <p className="text-sm text-gray-600 mt-2">Batch: {item.batch_number ?? 'N/A'}</p>
                  <p className="text-sm text-red-600 font-semibold mt-2">Remaining: {item.quantity_remaining ?? '—'}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Medicine</th>
                    <th className="px-4 py-3 text-left font-medium">Batch</th>
                    <th className="px-4 py-3 text-left font-medium">Remaining</th>
                    <th className="px-4 py-3 text-left font-medium">Expiry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredLowStock.length === 0 ? (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No low stock items found.</td></tr>
                  ) : filteredLowStock.map(item => (
                    <tr key={`${item.id}-${item.batch_number}`} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{item.medicine?.name ?? 'Unknown'}</td>
                      <td className="px-4 py-3 text-gray-500">{item.batch_number ?? '—'}</td>
                      <td className="px-4 py-3 text-red-600">{item.quantity_remaining ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Expiring Soon</h2>
              <p className="text-sm text-gray-500">Batches due to expire soon.</p>
            </div>
            <span className="text-xs uppercase tracking-wide text-gray-400">{filteredExpiring.length} batches</span>
          </div>
          {viewMode === 'cards' ? (
            <div className="p-4 grid gap-4 sm:grid-cols-2">
              {filteredExpiring.length === 0 ? (
                <div className="col-span-full text-center text-gray-400 py-12">No expiring batches found.</div>
              ) : filteredExpiring.map(batch => (
                <div key={`${batch.id}-${batch.batch_number}`} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">{batch.medicine?.name ?? 'Unknown medicine'}</p>
                  <p className="text-lg font-semibold text-gray-900">Batch {batch.batch_number ?? 'N/A'}</p>
                  <p className="text-sm text-gray-600 mt-2">Remaining: {batch.quantity_remaining ?? '—'}</p>
                  <p className="text-sm text-yellow-700 font-semibold mt-2">Expires {batch.expiry_date ? new Date(batch.expiry_date).toLocaleDateString() : '—'}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Medicine</th>
                    <th className="px-4 py-3 text-left font-medium">Batch</th>
                    <th className="px-4 py-3 text-left font-medium">Remaining</th>
                    <th className="px-4 py-3 text-left font-medium">Expiry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredExpiring.length === 0 ? (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No expiring batches found.</td></tr>
                  ) : filteredExpiring.map(batch => (
                    <tr key={`${batch.id}-${batch.batch_number}`} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{batch.medicine?.name ?? 'Unknown'}</td>
                      <td className="px-4 py-3 text-gray-500">{batch.batch_number ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-900">{batch.quantity_remaining ?? '—'}</td>
                      <td className="px-4 py-3 text-yellow-700">{batch.expiry_date ? new Date(batch.expiry_date).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Recent Stock Movements</h2>
          <p className="text-sm text-gray-500">Latest inventory activity and movement history.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                {['Medicine','Type','Quantity','Reference','Notes','Date'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredMovements.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No inventory movements found.</td></tr>
              ) : filteredMovements.map(movement => (
                <tr key={movement.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{movement.medicine?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500 capitalize">{movement.movement_type ?? movement.type}</td>
                  <td className="px-4 py-3 text-gray-900">{movement.quantity}</td>
                  <td className="px-4 py-3 text-gray-500">{movement.reference ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{movement.notes ?? movement.note ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{movement.created_at ? new Date(movement.created_at).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
