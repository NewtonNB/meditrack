import { useState, useMemo } from 'react';
import { useApi, getListItems } from '../hooks/useApi';
import { sales as api, pos as posApi } from '../api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ConfirmDialog from '../Components/ConfirmDialog';
import SaleModal from '../Components/SaleModal';
import PermissionGate from '../Components/PermissionGate';

// ── Payment badge colours ─────────────────────────────────────────────────────
const PAYMENT_STYLES = {
  cash:         'bg-green-100 text-green-700',
  mobile_money: 'bg-purple-100 text-purple-700',
  card:         'bg-blue-100 text-blue-700',
  insurance:    'bg-cyan-100 text-cyan-700',
  credit:       'bg-amber-100 text-amber-700',
};

const paymentLabel = (m) =>
  (m ?? 'cash').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

// ── Status badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ sale }) => {
  if (sale.status === 'refunded')
    return <span className="inline-flex items-center gap-1 text-xs font-medium bg-red-100 text-red-700 px-2 py-0.5 rounded-full"><i className="bi bi-arrow-counterclockwise" />Refunded</span>;
  if (sale.status === 'partially_refunded')
    return <span className="inline-flex items-center gap-1 text-xs font-medium bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full"><i className="bi bi-arrow-counterclockwise" />Part. Refunded</span>;
  return <span className="inline-flex items-center gap-1 text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full"><i className="bi bi-check-circle" />Completed</span>;
};

// ── Stat card ─────────────────────────────────────────────────────────────────
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
export default function Sales() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [perPage] = useState(25);
  const { data, loading, error, refetch } = useApi(() => api.list({ page, per_page: perPage }), [page, perPage]);

  const [search, setSearch]               = useState('');
  const [filterPayment, setFilterPayment]  = useState('all');
  const [filterStatus, setFilterStatus]    = useState('all');
  const [confirmId, setConfirmId]          = useState(null);
  const [saleModalOpen, setSaleModalOpen]  = useState(false);

  const allItems = getListItems(data);
  const total = data?.total ?? allItems.length;
  const currentPage = data?.current_page ?? 1;
  const lastPage = data?.last_page ?? 1;

  // ── Filters ───────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = allItems;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        s.medicine?.name?.toLowerCase().includes(q) ||
        s.customer?.name?.toLowerCase().includes(q) ||
        s.invoice?.toLowerCase().includes(q) ||
        String(s.id).includes(q)
      );
    }
    if (filterPayment !== 'all')
      list = list.filter(s => (s.payment_method ?? 'cash') === filterPayment);
    if (filterStatus !== 'all')
      list = list.filter(s => (s.status ?? 'completed') === filterStatus);
    return list;
  }, [allItems, search, filterPayment, filterStatus]);

  // ── Summary stats ──────────────────────────────────────────────────────────
  const totalRevenue  = allItems.reduce((s, x) => s + Number(x.total_price ?? 0), 0);
  const totalQty      = allItems.reduce((s, x) => s + Number(x.quantity ?? 0), 0);
  const todaySales    = allItems.filter(s => new Date(s.created_at).toDateString() === new Date().toDateString());
  const todayRevenue  = todaySales.reduce((s, x) => s + Number(x.total_price ?? 0), 0);

  // ── Refund ────────────────────────────────────────────────────────────────
  const handleRefund = async () => {
    const id = confirmId;
    setConfirmId(null);
    try {
      await api.refund(id, { reason: 'Refund requested', refund_amount: allItems.find(s => s.id === id)?.total_price ?? 0 });
      toast.success('Refund processed.');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process refund.');
    }
  };

  // ── Download Receipt ───────────────────────────────────────────────────────
  const handleDownloadReceipt = async (id) => {
    try {
      const { data } = await posApi.receipt(id);
      const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Receipt downloaded successfully.');
    } catch (err) {
      toast.error('Failed to download receipt.');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-2 text-gray-400">
      <i className="bi bi-arrow-clockwise animate-spin text-xl" /> Loading sales…
    </div>
  );
  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="space-y-5">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate(-1)} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
            <i className="bi bi-arrow-left" /> Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sales</h1>
            <p className="text-sm text-gray-400 mt-0.5">{allItems.length} total transactions</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <PermissionGate permission="process_sales">
            <button
              onClick={() => setSaleModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <i className="bi bi-plus-lg" /> Add Sale
            </button>
          </PermissionGate>
          <button
            onClick={() => navigate('/pos')}
            className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <i className="bi bi-cart3" /> POS
          </button>
        </div>
      </div>

      {/* ── Stat cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="bi-receipt"     label="Total Sales"     value={allItems.length}                              colour="bg-blue-100 text-blue-600" />
        <StatCard icon="bi-cash-stack"  label="Total Revenue"   value={`UGX ${totalRevenue.toLocaleString()}`}       colour="bg-green-100 text-green-600" />
        <StatCard icon="bi-calendar-check" label="Today's Sales" value={todaySales.length} sub={`UGX ${todayRevenue.toLocaleString()}`} colour="bg-purple-100 text-purple-600" />
        <StatCard icon="bi-capsule"     label="Units Sold"      value={totalQty.toLocaleString()}                    colour="bg-amber-100 text-amber-600" />
      </div>

      {/* ── Table card ─────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

        {/* Toolbar */}
        <div className="px-5 py-3 border-b border-gray-100 flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-48 max-w-sm">
            <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search by medicine, customer, invoice…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full border border-gray-300 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <i className="bi bi-x" />
              </button>
            )}
          </div>

          {/* Payment filter */}
          <select
            value={filterPayment}
            onChange={e => setFilterPayment(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">All payments</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="mobile_money">Mobile Money</option>
            <option value="insurance">Insurance</option>
            <option value="credit">Credit</option>
          </select>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">All statuses</option>
            <option value="completed">Completed</option>
            <option value="refunded">Refunded</option>
            <option value="partially_refunded">Partially refunded</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="px-5 py-3 text-left w-24">Invoice</th>
                <th className="px-4 py-3 text-left">Medicine</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-center w-16">Qty</th>
                <th className="px-4 py-3 text-right w-36">Total</th>
                <th className="px-4 py-3 text-left w-36">Payment</th>
                <th className="px-4 py-3 text-left w-28">Status</th>
                <th className="px-4 py-3 text-left w-36">Date</th>
                <th className="px-4 py-3 text-center w-20">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center">
                    <i className="bi bi-receipt text-3xl text-gray-200 block mb-2" />
                    <p className="text-gray-400 text-sm">
                      {search || filterPayment !== 'all' || filterStatus !== 'all'
                        ? 'No sales match your filters.'
                        : 'No sales recorded yet.'}
                    </p>
                  </td>
                </tr>
              ) : filtered.map(s => {
                const canRefund = !['refunded'].includes(s.status);
                const pm = s.payment_method ?? 'cash';
                const date = new Date(s.created_at);

                return (
                  <tr key={s.id} className="hover:bg-blue-50/30 transition-colors">

                    {/* Invoice */}
                    <td className="px-5 py-3">
                      <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        {s.invoice ?? `#${s.id}`}
                      </span>
                    </td>

                    {/* Medicine */}
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{s.medicine?.name ?? '—'}</p>
                      {s.notes && <p className="text-xs text-gray-400 truncate max-w-40" title={s.notes}>{s.notes}</p>}
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-3">
                      {s.customer?.name
                        ? <div>
                            <p className="text-gray-800 font-medium">{s.customer.name}</p>
                            {s.customer.phone && <p className="text-xs text-gray-400">{s.customer.phone}</p>}
                          </div>
                        : <span className="inline-flex items-center gap-1 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                            <i className="bi bi-person" /> Walk-in
                          </span>
                      }
                    </td>

                    {/* Qty */}
                    <td className="px-4 py-3 text-center">
                      <span className="font-semibold text-gray-700">{s.quantity}</span>
                    </td>

                    {/* Total */}
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-gray-900 tabular-nums">
                        UGX {Number(s.total_price ?? 0).toLocaleString()}
                      </span>
                      {s.unit_price && (
                        <p className="text-xs text-gray-400 tabular-nums">
                          @ UGX {Number(s.unit_price).toLocaleString()}
                        </p>
                      )}
                    </td>

                    {/* Payment method */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${PAYMENT_STYLES[pm] ?? 'bg-gray-100 text-gray-600'}`}>
                        <i className={`bi ${pm === 'cash' ? 'bi-cash' : pm === 'card' ? 'bi-credit-card' : pm === 'mobile_money' ? 'bi-phone' : 'bi-shield-check'}`} />
                        {paymentLabel(pm)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge sale={s} />
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3">
                      <p className="text-gray-700 text-sm">{date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                      <p className="text-xs text-gray-400">{date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleDownloadReceipt(s.id)}
                          title="Download Receipt"
                          className="inline-flex items-center justify-center text-xs font-medium text-green-600 hover:text-white hover:bg-green-500 border border-green-200 hover:border-green-500 p-1.5 rounded-lg transition-colors"
                        >
                          <i className="bi bi-file-earmark-pdf" />
                        </button>
                        {canRefund
                          ? <PermissionGate permission="process_sales">
                              <button
                                onClick={() => setConfirmId(s.id)}
                                className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 hover:text-white hover:bg-orange-500 border border-orange-200 hover:border-orange-500 px-2 py-1.5 rounded-lg transition-colors"
                                title="Process refund"
                              >
                                <i className="bi bi-arrow-counterclockwise" /> Refund
                              </button>
                            </PermissionGate>
                          : null
                        }
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {allItems.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              Page {currentPage} of {lastPage} · {total} total transaction{total !== 1 ? 's' : ''}
              {search && ` · matching "${search}"`}
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setPage(p => Math.max(1, p-1))} disabled={currentPage <= 1} className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40">Previous</button>
              <button type="button" onClick={() => setPage(p => Math.min(lastPage, p+1))} disabled={currentPage >= lastPage} className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmId !== null}
        title="Process Refund"
        message="This will reverse the sale and return the amount to the customer. Are you sure you want to proceed?"
        confirmLabel="Process Refund"
        confirmVariant="warning"
        onConfirm={handleRefund}
        onCancel={() => setConfirmId(null)}
      />

      <SaleModal
        isOpen={saleModalOpen}
        onClose={() => setSaleModalOpen(false)}
        onSave={refetch}
      />
    </div>
  );
}
