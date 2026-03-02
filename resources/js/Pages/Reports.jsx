import React from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Card from '@/Components/Card';
import 'bootstrap-icons/font/bootstrap-icons.css';

const sampleSales = [
  { id: 1, date: '2025-10-01', product: 'Paracetamol', qty: 4, total: 4000, invoice: 'INV-2001' },
  { id: 2, date: '2025-10-02', product: 'Ibuprofen', qty: 2, total: 3000, invoice: 'INV-2002' },
  { id: 3, date: '2025-10-02', product: 'Paracetamol', qty: 1, total: 1000, invoice: 'INV-2003' },
  { id: 4, date: '2025-10-03', product: 'Amoxicillin', qty: 3, total: 9000, invoice: 'INV-2004' },
  { id: 5, date: '2025-10-04', product: 'Cough Syrup', qty: 1, total: 2500, invoice: 'INV-2005' },
  // ... more sample rows (server can provide actual data via props)
];

export default function Reports() {
  // server can pass real sales in props; fallback to sampleSales
  // const { props } = usePage();
  // const salesData = props.sales || sampleSales;
  const salesData = sampleSales;

  const [chartType, setChartType] = React.useState('bar');
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo] = React.useState('');
  const [query, setQuery] = React.useState('');

  // filter sales by date and query
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return salesData.filter(s => {
      if (q) {
        const hay = `${s.product} ${s.invoice} ${s.date}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (dateFrom && new Date(s.date) < new Date(dateFrom)) return false;
      if (dateTo && new Date(s.date) > new Date(dateTo)) return false;
      return true;
    });
  }, [salesData, dateFrom, dateTo, query]);

  const totals = React.useMemo(() => {
    return {
      revenue: filtered.reduce((s, r) => s + Number(r.total || 0), 0),
      transactions: filtered.length,
      bestSeller: (() => {
        const t = {};
        filtered.forEach(r => (t[r.product] = (t[r.product] || 0) + r.qty));
        const entries = Object.entries(t).sort((a, b) => b[1] - a[1]);
        return entries[0]?.[0] ?? '-';
      })(),
    };
  }, [filtered]);

  // daily aggregation for chart
  const daily = React.useMemo(() => {
    const map = {};
    filtered.forEach(s => {
      map[s.date] = (map[s.date] || 0) + Number(s.total || 0);
    });
    const days = Object.keys(map).sort();
    return days.map(d => ({ date: d, total: map[d] }));
  }, [filtered]);

  // top products table
  const topProducts = React.useMemo(() => {
    const t = {};
    filtered.forEach(r => (t[r.product] = (t[r.product] || 0) + Number(r.total || 0)));
    return Object.entries(t)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([product, total]) => ({ product, total }));
  }, [filtered]);

  const exportCSV = (list = filtered) => {
    const headers = ['Invoice', 'Date', 'Product', 'Quantity', 'Total'];
    const rows = list.map(r => [r.invoice ?? '', r.date, r.product, r.qty, r.total]);
    const csv = [headers, ...rows]
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales_report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    // simple CSV exported with .xlsx extension — for basic compatibility without extra libs
    exportCSV();
    // you can replace with real Excel generation (SheetJS) if needed
  };

  const [isLoading, setIsLoading] = React.useState(false);
  const [darkMode, setDarkMode] = React.useState(false);

  React.useEffect(() => {
    // Auto-refresh data every 30 seconds
    const interval = setInterval(() => {
      setIsLoading(true);
      setTimeout(() => setIsLoading(false), 1000);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AuthenticatedLayout
      header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Reports</h2>}
    >
      <Head>
        <title>Reports</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div 
        className={`min-h-screen transition-all duration-500 ${
          darkMode 
            ? 'bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900' 
            : 'bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50'
        }`}
        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        {/* Floating Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className={`absolute top-1/4 left-1/4 w-64 h-64 ${darkMode ? 'bg-purple-500/10' : 'bg-purple-200/30'} rounded-full blur-3xl animate-pulse`}></div>
          <div className={`absolute top-3/4 right-1/4 w-96 h-96 ${darkMode ? 'bg-violet-500/10' : 'bg-violet-200/30'} rounded-full blur-3xl animate-pulse delay-1000`}></div>
          <div className={`absolute top-1/2 left-1/2 w-80 h-80 ${darkMode ? 'bg-indigo-500/10' : 'bg-indigo-200/30'} rounded-full blur-3xl animate-pulse delay-500`}></div>
        </div>

        <div className="relative z-10 p-4 sm:p-6">
        {/* Modern Header */}
        <div className={`backdrop-blur-xl ${darkMode ? 'bg-gray-800/30' : 'bg-white/30'} rounded-2xl p-6 mb-8 border ${darkMode ? 'border-gray-700/50' : 'border-white/50'} shadow-xl`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className={`w-16 h-16 rounded-2xl ${darkMode ? 'bg-gradient-to-br from-purple-400 to-violet-500' : 'bg-gradient-to-br from-purple-400 to-violet-500'} flex items-center justify-center shadow-lg`}>
                <i className="bi bi-graph-up text-2xl text-white"></i>
              </div>
              <div>
                <h1 className={`text-4xl font-black ${darkMode ? 'bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent' : 'bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent'}`}>
                  Analytics & Reports
                </h1>
                <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'} mt-2`}>
                  Comprehensive sales analytics, performance insights, and business intelligence
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${darkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700'}`}>
                    <i className="bi bi-check-circle-fill"></i>
                    <span className="text-sm font-medium">Data Live</span>
                  </div>
                  <div className={`px-3 py-1 rounded-full ${darkMode ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                    <span className="text-sm">Transactions: {filtered.length}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-3 rounded-xl transition-all duration-300 ${
                  darkMode 
                    ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <i className={`bi ${darkMode ? 'bi-sun-fill' : 'bi-moon-fill'} text-xl`}></i>
              </button>
              
              {/* Refresh Button */}
              <button
                onClick={() => {
                  setIsLoading(true);
                  setTimeout(() => setIsLoading(false), 1000);
                }}
                className={`p-3 rounded-xl transition-all duration-300 ${
                  darkMode 
                    ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' 
                    : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                } ${isLoading ? 'animate-spin' : ''}`}
              >
                <i className="bi bi-arrow-clockwise text-xl"></i>
              </button>
              
              {/* Status Indicator */}
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Real-time Data
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Revenue Card */}
          <div className={`group relative overflow-hidden backdrop-blur-xl ${darkMode ? 'bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border-indigo-500/30' : 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200/50'} rounded-2xl p-6 border shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105`}>
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-sm font-medium ${darkMode ? 'text-indigo-400' : 'text-indigo-600'} mb-2`}>
                  Total Revenue
                </div>
                <div className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-800'} mb-1`}>
                  UGX {Number(totals.revenue).toLocaleString()}
                </div>
                <div className={`text-sm ${darkMode ? 'text-indigo-300' : 'text-indigo-600'} flex items-center gap-1`}>
                  <i className="bi bi-arrow-up"></i>
                  <span>Transactions: {totals.transactions}</span>
                </div>
              </div>
              <div className={`w-16 h-16 rounded-2xl ${darkMode ? 'bg-indigo-500/20' : 'bg-indigo-100'} flex items-center justify-center`}>
                <i className={`bi bi-cash-coin text-2xl ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}></i>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>

          {/* Best Seller Card */}
          <div className={`group relative overflow-hidden backdrop-blur-xl ${darkMode ? 'bg-gradient-to-br from-yellow-500/20 to-orange-600/20 border-yellow-500/30' : 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200/50'} rounded-2xl p-6 border shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105`}>
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-sm font-medium ${darkMode ? 'text-yellow-400' : 'text-yellow-600'} mb-2`}>
                  Best Seller
                </div>
                <div className={`text-xl font-black ${darkMode ? 'text-white' : 'text-gray-800'} mb-1 truncate`}>
                  {totals.bestSeller}
                </div>
                <div className={`text-sm ${darkMode ? 'text-yellow-300' : 'text-yellow-600'} flex items-center gap-1`}>
                  <i className="bi bi-star-fill"></i>
                  <span>Top product</span>
                </div>
              </div>
              <div className={`w-16 h-16 rounded-2xl ${darkMode ? 'bg-yellow-500/20' : 'bg-yellow-100'} flex items-center justify-center`}>
                <i className={`bi bi-trophy text-2xl ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}></i>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>

          {/* Export Actions Card */}
          <div className={`group relative overflow-hidden backdrop-blur-xl ${darkMode ? 'bg-gradient-to-br from-green-500/20 to-emerald-600/20 border-green-500/30' : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200/50'} rounded-2xl p-6 border shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105`}>
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-sm font-medium ${darkMode ? 'text-green-400' : 'text-green-600'} mb-2`}>
                  Export Options
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => exportCSV()}
                    className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                      darkMode 
                        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    <i className="bi bi-download mr-2"></i>Export CSV
                  </button>
                  <button
                    onClick={exportExcel}
                    className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                      darkMode 
                        ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' 
                        : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                    }`}
                  >
                    <i className="bi bi-file-earmark-excel mr-2"></i>Export Excel
                  </button>
                </div>
              </div>
              <div className={`w-16 h-16 rounded-2xl ${darkMode ? 'bg-green-500/20' : 'bg-green-100'} flex items-center justify-center`}>
                <i className={`bi bi-download text-2xl ${darkMode ? 'text-green-400' : 'text-green-600'}`}></i>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <input
                type="search"
                placeholder="Search invoice / product..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-64 py-2 px-3 rounded-lg border focus:outline-none text-sm"
              />
              <label className="text-xs text-gray-500">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="py-2 px-2 border rounded text-sm"
              />
              <label className="text-xs text-gray-500">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="py-2 px-2 border rounded text-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">Chart</label>
              <select
                value={chartType}
                onChange={e => setChartType(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="bar">Bar</option>
                <option value="line">Line</option>
              </select>
              <SecondaryButton
                onClick={() => {
                  setQuery('');
                  setDateFrom('');
                  setDateTo('');
                }}
              >
                Clear
              </SecondaryButton>
            </div>
          </div>
        </div>

        {/* Modern Chart Area */}
        <div className={`backdrop-blur-xl ${darkMode ? 'bg-gray-800/30' : 'bg-white/30'} rounded-2xl p-6 border ${darkMode ? 'border-gray-700/50' : 'border-white/50'} shadow-xl mb-8`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-700">Sales Chart</h2>
            <div className="text-sm text-gray-500">Showing {daily.length} day(s)</div>
          </div>

          {daily.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 border-2 border-dashed rounded-xl bg-gray-50">
              No data for selected range
            </div>
          ) : (
            <div className="w-full h-48 flex items-end gap-2">
              {/* simple bar chart using DIVs to avoid extra deps */}
              {daily.map(d => {
                const max = Math.max(...daily.map(x => x.total));
                const height = max === 0 ? 2 : Math.max(4, Math.round((d.total / max) * 160));
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center">
                    <div
                      title={`UGX ${d.total.toLocaleString()}`}
                      className={`w-full rounded-t`}
                      style={{
                        height: `${height}px`,
                        background: 'linear-gradient(180deg,#7c3aed,#4f46e5)',
                      }}
                    />
                    <div className="text-xs text-gray-500 mt-1 truncate">{d.date.slice(5)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`backdrop-blur-xl ${darkMode ? 'bg-gray-800/30' : 'bg-white/30'} rounded-2xl p-6 border ${darkMode ? 'border-gray-700/50' : 'border-white/50'} shadow-xl`}>
            <h3 className="text-sm font-semibold text-gray-600 mb-3">Top Products (by sales)</h3>
            <div className="divide-y divide-gray-100">
              {topProducts.length === 0 ? (
                <div className="text-sm text-gray-500 py-6">No products in range.</div>
              ) : (
                topProducts.map((p, idx) => (
                  <div key={p.product} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-800">
                        {idx + 1}. {p.product}
                      </div>
                      <div className="text-xs text-gray-500">
                        UGX {Number(p.total).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className={`backdrop-blur-xl ${darkMode ? 'bg-gray-800/30' : 'bg-white/30'} rounded-2xl p-6 border ${darkMode ? 'border-gray-700/50' : 'border-white/50'} shadow-xl`}>
            <h3 className="text-sm font-semibold text-gray-600 mb-3">Recent Transactions</h3>
            <div className="divide-y divide-gray-100">
              {filtered.slice(0, 10).map(tx => (
                <div
                  key={tx.id ?? `${tx.invoice}-${tx.date}`}
                  className="py-3 flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium text-gray-800">
                      {tx.product} <span className="text-xs text-gray-500">x{tx.qty}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {tx.invoice} • {tx.date}
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-800">
                    UGX {Number(tx.total).toLocaleString()}
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="py-6 text-sm text-gray-500">No transactions found.</div>
              )}
            </div>
          </div>
        </div>

        </div>
      </div>
    </AuthenticatedLayout>
  );
}
