import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { system as systemApi } from '../api';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

// ── helpers ───────────────────────────────────────────────────────────────────

function fmt(n) {
  const num = Number(n ?? 0);
  if (num >= 1_000_000) return `UGX ${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000)     return `UGX ${(num / 1_000).toFixed(1)}K`;
  return `UGX ${num.toLocaleString()}`;
}

function GrowthBadge({ value }) {
  const num = Number(value ?? 0);
  if (num === 0) return <span className="text-xs text-gray-400">No change</span>;
  const pos = num > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${pos ? 'text-green-600' : 'text-red-500'}`}>
      <i className={`bi bi-arrow-${pos ? 'up' : 'down'}`} />
      {Math.abs(num).toFixed(1)}% vs last month
    </span>
  );
}

const HEALTH_CONFIG = {
  excellent: { label: 'Excellent',    cls: 'bg-green-100 text-green-700 border-green-300',  dot: 'bg-green-500',  bar: 100 },
  good:      { label: 'Good',         cls: 'bg-blue-100 text-blue-700 border-blue-300',     dot: 'bg-blue-500',   bar: 80  },
  fair:      { label: 'Fair',         cls: 'bg-yellow-100 text-yellow-700 border-yellow-300', dot: 'bg-yellow-500', bar: 55  },
  poor:      { label: 'Needs Work',   cls: 'bg-red-100 text-red-700 border-red-300',        dot: 'bg-red-500',    bar: 30  },
  unknown:   { label: 'Unknown',      cls: 'bg-gray-100 text-gray-700 border-gray-300',     dot: 'bg-gray-400',   bar: 0   },
};

const PIE_COLORS = ['#3b82f6', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6'];

// ── sub-components ────────────────────────────────────────────────────────────

function MetricCard({ title, value, icon, color, sub, trend, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`bg-white rounded-xl p-5 shadow-sm border border-gray-100 text-left w-full transition-all hover:shadow-md hover:-translate-y-0.5 ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
          <i className={`bi ${icon} text-white text-base`} />
        </div>
        {trend !== undefined && <GrowthBadge value={trend} />}
      </div>
      <p className="text-2xl font-bold text-gray-900 leading-none">{value ?? '—'}</p>
      <p className="text-sm text-gray-500 mt-1 font-medium">{title}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </button>
  );
}

function SectionHeader({ title, sub, action, onAction }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="font-semibold text-gray-800">{title}</h2>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      {action && (
        <button onClick={onAction} className="text-xs text-blue-600 hover:underline">{action} →</button>
      )}
    </div>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────

export default function SystemOverview() {
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useApi(() => systemApi.stats());
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-2 text-gray-400">
      <i className="bi bi-arrow-clockwise animate-spin text-xl" /> Loading system overview…
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6">
      <p className="font-semibold">Failed to load system overview</p>
      <p className="text-sm mt-1">{error}</p>
      <button onClick={refetch} className="mt-3 text-sm font-medium underline">Try again</button>
    </div>
  );

  const stats  = data?.stats  ?? {};
  const health = data?.systemHealth ?? 'unknown';
  const hConf  = HEALTH_CONFIG[health] ?? HEALTH_CONFIG.unknown;
  const updated = data?.lastUpdated ? new Date(data.lastUpdated).toLocaleString() : '—';

  // Inventory distribution for pie chart
  const totalMeds  = stats.totalMedicines ?? 0;
  const lowStock   = stats.lowStockMedicines ?? 0;
  const normalStock = Math.max(0, totalMeds - lowStock);

  const inventoryPie = [
    { name: 'Normal Stock',   value: normalStock },
    { name: 'Low Stock',      value: lowStock     },
    { name: 'New Customers',  value: stats.newCustomersThisMonth ?? 0 },
  ].filter(d => d.value > 0);

  // Revenue bar (today vs monthly average)
  const monthDays     = new Date().getDate();
  const avgDailyRev   = monthDays > 0 ? (stats.totalRevenue ?? 0) / monthDays : 0;
  const revenueCompare = [
    { label: "Today's Revenue", value: stats.todayRevenue ?? 0 },
    { label: 'Daily Avg (All Time)', value: avgDailyRev },
  ];

  // KPI summary list
  const kpis = [
    { label: 'Total Revenue',      value: fmt(stats.totalRevenue),       icon: 'bi-currency-dollar', color: 'text-green-600' },
    { label: "Today's Revenue",    value: fmt(stats.todayRevenue),        icon: 'bi-calendar-check',  color: 'text-blue-600'  },
    { label: "Today's Sales",      value: (stats.todaySales ?? 0).toLocaleString(), icon: 'bi-receipt', color: 'text-indigo-600' },
    { label: 'Total Sales',        value: (stats.totalSales ?? 0).toLocaleString(), icon: 'bi-graph-up', color: 'text-purple-600' },
    { label: 'Total Customers',    value: (stats.totalCustomers ?? 0).toLocaleString(), icon: 'bi-people', color: 'text-pink-600' },
    { label: 'Active Suppliers',   value: (stats.activeSuppliers ?? 0).toLocaleString(), icon: 'bi-building', color: 'text-orange-600' },
  ];

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Overview</h1>
          <p className="text-sm text-gray-500 mt-0.5">Complete pharmacy health and performance metrics.</p>
          <p className="text-xs text-gray-400 mt-1">Last updated: {updated}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border capitalize ${hConf.cls}`}>
            <span className={`w-2 h-2 rounded-full ${hConf.dot}`} />
            System: {hConf.label}
          </span>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            <i className={`bi bi-arrow-clockwise ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* ── Health progress bar ─────────────────────────────────────────── */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-700">System Health Score</p>
          <p className="text-sm font-bold text-gray-900">{hConf.bar}%</p>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              hConf.bar >= 80 ? 'bg-green-500' : hConf.bar >= 55 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${hConf.bar}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Based on stock levels, sales activity, and expiry status.
        </p>
      </div>

      {/* ── Top metric cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Medicines"
          value={(stats.totalMedicines ?? 0).toLocaleString()}
          icon="bi-capsule"
          color="bg-blue-500"
          trend={stats.medicinesGrowth}
          sub={`${lowStock} low stock items`}
          onClick={() => navigate('/medicines')}
        />
        <MetricCard
          title="Total Customers"
          value={(stats.totalCustomers ?? 0).toLocaleString()}
          icon="bi-people"
          color="bg-purple-500"
          trend={stats.customersGrowth}
          sub={`${stats.newCustomersThisMonth ?? 0} new this month`}
          onClick={() => navigate('/customers')}
        />
        <MetricCard
          title="Total Sales"
          value={(stats.totalSales ?? 0).toLocaleString()}
          icon="bi-receipt"
          color="bg-green-500"
          trend={stats.salesGrowth}
          sub={`${stats.todaySales ?? 0} today`}
          onClick={() => navigate('/sales')}
        />
        <MetricCard
          title="Total Revenue"
          value={fmt(stats.totalRevenue)}
          icon="bi-currency-dollar"
          color="bg-orange-500"
          trend={stats.revenueGrowth}
          sub={`${fmt(stats.todayRevenue)} today`}
          onClick={() => navigate('/reports')}
        />
      </div>

      {/* ── Secondary cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Today's Sales Count"
          value={(stats.todaySales ?? 0).toLocaleString()}
          icon="bi-cart-check"
          color="bg-teal-500"
          sub={fmt(stats.todayRevenue)}
          onClick={() => navigate('/sales')}
        />
        <MetricCard
          title="Low Stock Items"
          value={(stats.lowStockMedicines ?? 0).toLocaleString()}
          icon="bi-exclamation-triangle"
          color={(stats.lowStockMedicines ?? 0) > 0 ? 'bg-yellow-500' : 'bg-green-500'}
          sub={(stats.lowStockMedicines ?? 0) > 0 ? 'Action required' : 'All well stocked'}
          onClick={() => navigate('/inventory')}
        />
        <MetricCard
          title="Active Suppliers"
          value={(stats.activeSuppliers ?? 0).toLocaleString()}
          icon="bi-building"
          color="bg-indigo-500"
          sub="Registered suppliers"
          onClick={() => navigate('/suppliers')}
        />
        <MetricCard
          title="New Customers"
          value={(stats.newCustomersThisMonth ?? 0).toLocaleString()}
          icon="bi-person-plus"
          color="bg-pink-500"
          sub="This month"
          onClick={() => navigate('/customers')}
        />
      </div>

      {/* ── Charts row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Revenue comparison bar */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <SectionHeader
            title="Revenue Comparison"
            sub="Today vs daily average"
            action="Full Reports"
            onAction={() => navigate('/reports')}
          />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueCompare} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
              <Tooltip formatter={v => [fmt(v), 'Revenue']} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}
                fill="#3b82f6"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Inventory distribution pie */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <SectionHeader
            title="Inventory Distribution"
            sub="Stock status breakdown"
            action="Manage Inventory"
            onAction={() => navigate('/inventory')}
          />
          {inventoryPie.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={200}>
                <PieChart>
                  <Pie
                    data={inventoryPie}
                    cx="50%" cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {inventoryPie.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {inventoryPie.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-xs text-gray-600 flex-1">{item.name}</span>
                    <span className="text-xs font-semibold text-gray-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400">
              <p className="text-sm">No inventory data yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── KPI summary table ───────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Key Performance Indicators</h2>
          <p className="text-xs text-gray-400 mt-0.5">Full summary of all system metrics</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
          {kpis.map((kpi, i) => (
            <div key={i} className="px-6 py-4 flex items-center gap-4">
              <i className={`bi ${kpi.icon} ${kpi.color} text-xl`} />
              <div>
                <p className="text-xs text-gray-500">{kpi.label}</p>
                <p className="text-lg font-bold text-gray-900">{kpi.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Growth badges row ───────────────────────────────────────────── */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-800 mb-4">Month-over-Month Growth</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Medicines',  value: stats.medicinesGrowth, icon: 'bi-capsule'          },
            { label: 'Customers',  value: stats.customersGrowth,  icon: 'bi-people'           },
            { label: 'Sales',      value: stats.salesGrowth,      icon: 'bi-receipt'          },
            { label: 'Revenue',    value: stats.revenueGrowth,    icon: 'bi-currency-dollar'  },
          ].map(({ label, value, icon }) => {
            const num = Number(value ?? 0);
            const pos = num >= 0;
            return (
              <div key={label} className={`rounded-xl p-4 ${pos ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <i className={`bi ${icon} ${pos ? 'text-green-600' : 'text-red-500'}`} />
                  <span className="text-xs font-medium text-gray-600">{label}</span>
                </div>
                <p className={`text-2xl font-bold ${pos ? 'text-green-700' : 'text-red-600'}`}>
                  {pos ? '+' : ''}{num.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-400 mt-1">vs last month</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Quick links ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-800 mb-4">Quick Navigation</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Medicines',    icon: 'bi-capsule',         path: '/medicines',    color: 'bg-blue-50 text-blue-700 hover:bg-blue-100'   },
            { label: 'Sales',        icon: 'bi-receipt',          path: '/sales',        color: 'bg-green-50 text-green-700 hover:bg-green-100' },
            { label: 'Inventory',    icon: 'bi-boxes',            path: '/inventory',    color: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
            { label: 'Reports',      icon: 'bi-bar-chart',        path: '/reports',      color: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
            { label: 'Customers',    icon: 'bi-people',           path: '/customers',    color: 'bg-pink-50 text-pink-700 hover:bg-pink-100'   },
            { label: 'Suppliers',    icon: 'bi-building',         path: '/suppliers',    color: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' },
            { label: 'Analytics',    icon: 'bi-graph-up',         path: '/analytics',    color: 'bg-teal-50 text-teal-700 hover:bg-teal-100'   },
            { label: 'Audit Logs',   icon: 'bi-shield-check',     path: '/audit-logs',   color: 'bg-red-50 text-red-700 hover:bg-red-100'      },
          ].map(({ label, icon, path, color }) => (
            <button
              key={label}
              onClick={() => navigate(path)}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${color}`}
            >
              <i className={`bi ${icon} text-base`} />
              {label}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
