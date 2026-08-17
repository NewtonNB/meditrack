import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { reports as api } from '../api';
import { toast } from 'react-toastify';
import { SkeletonStatCard } from '../Components/Skeleton';

const downloadBlob = (data, filename) => {
  const url = URL.createObjectURL(new Blob([data]));
  const a   = document.createElement('a');
  a.href    = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const fmt = (n) => `UGX ${Number(n ?? 0).toLocaleString()}`;

// Default date range: last 30 days
const today     = new Date().toISOString().split('T')[0];
const thirtyAgo = new Date(Date.now() - 30 * 86400_000).toISOString().split('T')[0];

function StatCard({ label, value, icon, color }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
      <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
        <i className={`bi ${icon} text-white text-lg`} />
      </div>
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function ReportCard({ title, desc, icon, color, dateFrom, dateTo, exportPdf, exportExcel, previewFn, previewCols }) {
  const [dlPdf,    setDlPdf]    = useState(false);
  const [dlExcel,  setDlExcel]  = useState(false);
  const [preview,  setPreview]  = useState(false);
  const [prevData, setPrevData] = useState(null);
  const [prevLoad, setPrevLoad] = useState(false);

  const download = async (fn, filename, setLoading) => {
    setLoading(true);
    try {
      const { data } = await fn({ from: dateFrom, to: dateTo });
      downloadBlob(data, filename);
      toast.success(`${filename} downloaded.`);
    } catch {
      toast.error('Failed to generate report.');
    } finally {
      setLoading(false);
    }
  };

  const togglePreview = async () => {
    if (preview) { setPreview(false); return; }
    setPreview(true);
    if (prevData) return;
    setPrevLoad(true);
    try {
      const res = await previewFn({ from: dateFrom, to: dateTo });
      const rows = res.data?.data ?? res.data ?? [];
      setPrevData(Array.isArray(rows) ? rows : []);
    } catch {
      setPrevData([]);
    } finally {
      setPrevLoad(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-9 h-9 ${color} rounded-lg flex items-center justify-center`}>
            <i className={`bi ${icon} text-white`} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-xs text-gray-500">{desc}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <button
            onClick={() => download(exportPdf, `${title.toLowerCase().replace(/\s/g,'-')}.pdf`, setDlPdf)}
            disabled={dlPdf}
            className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
          >
            {dlPdf ? <i className="bi bi-arrow-clockwise animate-spin" /> : <i className="bi bi-file-earmark-pdf" />}
            Export PDF
          </button>
          <button
            onClick={() => download(exportExcel, `${title.toLowerCase().replace(/\s/g,'-')}.xlsx`, setDlExcel)}
            disabled={dlExcel}
            className="flex items-center gap-1.5 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
          >
            {dlExcel ? <i className="bi bi-arrow-clockwise animate-spin" /> : <i className="bi bi-file-earmark-excel" />}
            Export Excel
          </button>
          <button
            onClick={togglePreview}
            className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            <i className={`bi ${preview ? 'bi-chevron-up' : 'bi-eye'}`} />
            {preview ? 'Hide Preview' : 'Preview Data'}
          </button>
        </div>
      </div>

      {preview && (
        <div className="overflow-x-auto">
          {prevLoad ? (
            <div className="p-6 space-y-2">
              {[1,2,3,4].map(i => <div key={i} className="skeleton-shimmer h-3 rounded w-full" />)}
            </div>
          ) : prevData && prevData.length > 0 ? (
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase">
                <tr>
                  {previewCols.map(c => (
                    <th key={c.key} className="px-4 py-2 text-left font-medium">{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {prevData.slice(0, 10).map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    {previewCols.map(c => (
                      <td key={c.key} className="px-4 py-2 text-gray-700">
                        {c.format ? c.format(row[c.key]) : (row[c.key] ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="px-4 py-6 text-center text-sm text-gray-400">No data for selected date range.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function Reports() {
  const [dateFrom, setDateFrom] = useState(thirtyAgo);
  const [dateTo,   setDateTo]   = useState(today);

  const dashboard = useApi(() => api.dashboard());
  const stats     = dashboard.data ?? {};

  const reportCards = [
    {
      title: 'Sales Report',
      desc: 'Detailed sales data with revenue breakdown.',
      icon: 'bi-receipt',
      color: 'bg-blue-500',
      exportPdf:   api.salesPdf,
      exportExcel: api.salesExcel,
      previewFn:   api.sales,
      previewCols: [
        { key: 'id',           label: 'ID' },
        { key: 'customer',     label: 'Customer',  format: v => v?.name ?? 'Walk-in' },
        { key: 'total_amount', label: 'Amount',    format: v => fmt(v) },
        { key: 'payment_method', label: 'Payment' },
        { key: 'created_at',   label: 'Date',      format: v => v ? new Date(v).toLocaleDateString() : '—' },
      ],
    },
    {
      title: 'Expiry Report',
      desc: 'Medicines expiring within the selected range.',
      icon: 'bi-clock',
      color: 'bg-amber-500',
      exportPdf:   api.expiryPdf,
      exportExcel: api.expiryExcel,
      previewFn:   api.expiry,
      previewCols: [
        { key: 'name',          label: 'Medicine' },
        { key: 'batch_number',  label: 'Batch' },
        { key: 'quantity',      label: 'Qty' },
        { key: 'expiry_date',   label: 'Expires', format: v => v ? new Date(v).toLocaleDateString() : '—' },
      ],
    },
    {
      title: 'Stock Report',
      desc: 'Current stock levels and inventory value.',
      icon: 'bi-boxes',
      color: 'bg-green-500',
      exportPdf:   api.stockPdf,
      exportExcel: api.stockExcel,
      previewFn:   api.stock,
      previewCols: [
        { key: 'name',             label: 'Medicine' },
        { key: 'stock_quantity',   label: 'In Stock' },
        { key: 'reorder_level',    label: 'Reorder Lvl' },
        { key: 'selling_price',    label: 'Price', format: v => fmt(v) },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reports</h1>

      {/* Date range filter */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <p className="text-sm font-medium text-gray-700 mb-3">Date Range</p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">From</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">To</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button onClick={() => { setDateFrom(thirtyAgo); setDateTo(today); }}
            className="text-sm text-blue-600 hover:underline">Reset</button>
        </div>
      </div>

      {/* Dashboard summary */}
      {dashboard.loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0,1,2,3].map(i => <SkeletonStatCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Sales"      value={stats.total_sales ?? 0}        icon="bi-receipt"           color="bg-blue-500"   />
          <StatCard label="Total Revenue"    value={fmt(stats.total_revenue)}       icon="bi-currency-dollar"   color="bg-green-500"  />
          <StatCard label="Total Purchases"  value={stats.total_purchases ?? 0}     icon="bi-bag-check"         color="bg-purple-500" />
          <StatCard label="Expiring Soon"    value={stats.expiring_soon ?? 0}       icon="bi-clock"             color="bg-amber-500"  />
        </div>
      )}

      {/* Report cards */}
      <div className="space-y-4">
        {reportCards.map(r => (
          <ReportCard key={r.title} {...r} dateFrom={dateFrom} dateTo={dateTo} />
        ))}
      </div>
    </div>
  );
}
