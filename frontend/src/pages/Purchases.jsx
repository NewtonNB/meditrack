import { useState, useMemo } from 'react';
import { useApi, getListItems } from '../hooks/useApi';
import { useNavigate } from 'react-router-dom';
import { purchases as api } from '../api';
import { toast } from 'react-toastify';
import ConfirmDialog from '../Components/ConfirmDialog';
import PurchaseModal from '../Components/PurchaseModal';
import PermissionGate from '../Components/PermissionGate';

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS = {
  pending:            { label: 'Pending',           cls: 'bg-yellow-100 text-yellow-700', icon: 'bi-clock' },
  ordered:            { label: 'Ordered',            cls: 'bg-blue-100 text-blue-700',    icon: 'bi-truck' },
  received:           { label: 'Received',           cls: 'bg-green-100 text-green-700',  icon: 'bi-check-circle' },
  partially_received: { label: 'Part. Received',     cls: 'bg-teal-100 text-teal-700',    icon: 'bi-check2' },
  cancelled:          { label: 'Cancelled',          cls: 'bg-red-100 text-red-700',      icon: 'bi-x-circle' },
};

const StatusBadge = ({ status }) => {
  const s = STATUS[status] ?? { label: status, cls: 'bg-gray-100 text-gray-600', icon: 'bi-circle' };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${s.cls}`}>
      <i className={`bi ${s.icon}`} />{s.label}
    </span>
  );
};

const StatCard = ({ icon, label, value, sub, colour }) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${colour}`}>
      <i className={`bi ${icon} text-xl`} />
    </div>
    <div>
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
export default function Purchases() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [perPage] = useState(15);
  const { data, loading, error, refetch } = useApi(() => api.list({ page, per_page: perPage }), [page, perPage]);

  const [search,        setSearch]        = useState('');
  const [filterStatus,  setFilterStatus]  = useState('all');
  const [confirmId,     setConfirmId]     = useState(null);
  const [cancelReason,  setCancelReason]  = useState('');
  const [modalOpen,     setModalOpen]     = useState(false);

  const allItems = getListItems(data);
  const total = data?.total ?? allItems.length;
  const currentPage = data?.current_page ?? 1;
  const lastPage = data?.last_page ?? 1;

  // ── Filters ───────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = allItems;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.supplier?.name?.toLowerCase().includes(q) ||
        String(p.id).includes(q)
      );
    }
    if (filterStatus !== 'all')
      list = list.filter(p => p.status === filterStatus);
    return list;
  }, [allItems, search, filterStatus]);

  const handleBack = () => navigate(-1);
  const handlePreviousPage = () => setPage((prev) => Math.max(1, prev - 1));
  const handleNextPage = () => setPage((prev) => Math.min(lastPage, prev + 1));

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalSpend   = allItems.filter(p => p.status !== 'cancelled').reduce((s, p) => s + Number(p.total_amount ?? p.total_cost ?? 0), 0);
  const pendingCount = allItems.filter(p => p.status === 'pending').length;
  const orderedCount = allItems.filter(p => p.status === 'ordered').length;

  // ── Cancel ────────────────────────────────────────────────────────────────
  const handleCancel = async () => {
    const id = confirmId;
    setConfirmId(null);
    const reason = cancelReason.trim() || 'Cancelled by user';
    setCancelReason('');
    try {
      await api.cancel(id, { reason });
      toast.success('Purchase cancelled.');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel purchase.');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-2 text-gray-400">
      <i className="bi bi-arrow-clockwise animate-spin text-xl" /> Loading purchases…
    </div>
  );
  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="space-y-5">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <button type="button" onClick={handleBack} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
            <i className="bi bi-arrow-left" /> Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Purchases</h1>
            <p className="text-sm text-gray-400 mt-0.5">{allItems.length} purchase orders</p>
          </div>
        </div>
        <PermissionGate permission="manage_purchases">
          <button
            onClick={() => setModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <i className="bi bi-plus-lg" /> New Purchase
          </button>
        </PermissionGate>
      </div>

      {/* ── Stat cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="bi-bag-check"    label="Total Orders"   value={allItems.length}                          colour="bg-blue-100 text-blue-600" />
        <StatCard icon="bi-cash-stack"   label="Total Spend"    value={`UGX ${totalSpend.toLocaleString()}`}     colour="bg-green-100 text-green-600" />
        <StatCard icon="bi-clock"        label="Pending"        value={pendingCount} sub="awaiting action"       colour="bg-yellow-100 text-yellow-600" />
        <StatCard icon="bi-truck"        label="Ordered"        value={orderedCount} sub="in transit"            colour="bg-purple-100 text-purple-600" />
      </div>

      {/* ── Table card ─────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

        {/* Toolbar */}
        <div className="px-5 py-3 border-b border-gray-100 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48 max-w-sm">
            <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text" placeholder="Search by supplier or order ID…"
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full border border-gray-300 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <i className="bi bi-x" />
              </button>
            )}
          </div>

          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="all">All statuses</option>
            {Object.entries(STATUS).map(([val, s]) => (
              <option key={val} value={val}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="px-5 py-3 text-left w-20">Order</th>
                <th className="px-4 py-3 text-left">Supplier</th>
                <th className="px-4 py-3 text-center w-16">Items</th>
                <th className="px-4 py-3 text-right w-40">Total Cost</th>
                <th className="px-4 py-3 text-left w-32">Status</th>
                <th className="px-4 py-3 text-left w-36">Order Date</th>
                <th className="px-4 py-3 text-left w-36">Delivery Date</th>
                <th className="px-4 py-3 text-center w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center">
                    <i className="bi bi-bag text-3xl text-gray-200 block mb-2" />
                    <p className="text-gray-400 text-sm">
                      {search || filterStatus !== 'all' ? 'No purchases match your filters.' : 'No purchase orders yet.'}
                    </p>
                  </td>
                </tr>
              ) : filtered.map(p => {
                const canCancel  = ['pending', 'ordered'].includes(p.status);
                const canReceive = ['ordered', 'partially_received'].includes(p.status);
                const total      = Number(p.total_amount ?? p.total_cost ?? 0);
                const itemCount  = p.items?.length ?? '—';
                const orderDate  = new Date(p.created_at ?? p.purchase_date);
                const delivDate  = p.expected_delivery_date ? new Date(p.expected_delivery_date) : null;

                return (
                  <tr key={p.id} className="hover:bg-blue-50/30 transition-colors">

                    {/* Order # */}
                    <td className="px-5 py-3">
                      <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        #{p.id}
                      </span>
                    </td>

                    {/* Supplier */}
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{p.supplier?.name ?? '—'}</p>
                      {p.supplier?.phone && <p className="text-xs text-gray-400">{p.supplier.phone}</p>}
                    </td>

                    {/* Item count */}
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-semibold text-gray-700">{itemCount}</span>
                    </td>

                    {/* Total */}
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-gray-900 tabular-nums">
                        UGX {total.toLocaleString()}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status} />
                    </td>

                    {/* Order date */}
                    <td className="px-4 py-3">
                      <p className="text-gray-700">{orderDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                      <p className="text-xs text-gray-400">{orderDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>

                    {/* Delivery date */}
                    <td className="px-4 py-3">
                      {delivDate
                        ? <p className="text-gray-600">{delivDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                        : <span className="text-gray-300 text-xs">Not set</span>
                      }
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <PermissionGate permission="manage_purchases">
                          {canReceive && (
                            <button
                              onClick={() => toast.info('Receive flow coming soon.')}
                              className="inline-flex items-center gap-1 text-xs font-medium text-green-600 hover:text-white hover:bg-green-500 border border-green-200 hover:border-green-500 px-2 py-1 rounded-lg transition-colors"
                              title="Mark as received"
                            >
                              <i className="bi bi-check2" /> Receive
                            </button>
                          )}
                          {canCancel && (
                            <button
                              onClick={() => { setConfirmId(p.id); setCancelReason(''); }}
                              className="inline-flex items-center gap-1 text-xs font-medium text-red-500 hover:text-white hover:bg-red-500 border border-red-200 hover:border-red-500 px-2 py-1 rounded-lg transition-colors"
                              title="Cancel order"
                            >
                              <i className="bi bi-x-lg" /> Cancel
                            </button>
                          )}
                        </PermissionGate>
                        {!canCancel && !canReceive && (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-gray-400">
            <div>Showing {filtered.length} of {allItems.length} orders</div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePreviousPage}
                disabled={currentPage <= 1}
                className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={handleNextPage}
                disabled={currentPage >= lastPage}
                className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Cancel confirm with reason input */}
      <ConfirmDialog
        isOpen={confirmId !== null}
        title="Cancel Purchase Order"
        message={
          <div className="space-y-3">
            <p className="text-sm text-gray-600">This purchase order will be cancelled and cannot be reactivated.</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
              <input
                type="text"
                placeholder="e.g. Supplier unavailable…"
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        }
        confirmLabel="Cancel Order"
        confirmVariant="warning"
        onConfirm={handleCancel}
        onCancel={() => { setConfirmId(null); setCancelReason(''); }}
      />

      <PurchaseModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={refetch}
      />
    </div>
  );
}
