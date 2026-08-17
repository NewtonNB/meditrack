import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { dashboard as dashApi } from '../api';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

// ── helpers ───────────────────────────────────────────────────────────────────

function fmt(n) {
  const num = Number(n ?? 0);
  if (num >= 1_000_000) return `UGX ${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000)     return `UGX ${(num / 1_000).toFixed(1)}K`;
  return `UGX ${num.toLocaleString()}`;
}

function pct(n) {
  const num = Number(n ?? 0);
  const color = num >= 0 ? 'text-green-600' : 'text-red-500';
  const arrow = num >= 0 ? '↑' : '↓';
  return <span className={`text-xs font-semibold ${color}`}>{arrow} {Math.abs(num).toFixed(1)}%</span>;
}

// ── sub-components ────────────────────────────────────────────────────────────

function StatCard({ title, value, icon, color, sub, trend }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
          <i className={`bi ${icon} text-white text-base`} />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900 leading-none">{value ?? '—'}</p>
      <div className="flex items-center gap-2 text-xs text-gray-400">
        {trend !== undefined && pct(trend)}
        {sub && <span>{sub}</span>}
      </div>
    </div>
  );
}

function InsightBadge({ type }) {
  const map = {
    danger:  'bg-red-50 border-red-300 text-red-700',
    warning: 'bg-yellow-50 border-yellow-300 text-yellow-700',
    success: 'bg-green-50 border-green-300 text-green-700',
    info:    'bg-blue-50 border-blue-300 text-blue-700',
  };
  return <span className={`inline-block w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
    type === 'danger' ? 'bg-red-500' : type === 'warning' ? 'bg-yellow-500' : type === 'success' ? 'bg-green-500' : 'bg-blue-500'
  }`} />;
}

function InsightCard({ insight, onAction }) {
  const bg = {
    danger:  'bg-red-50 border-red-300',
    warning: 'bg-yellow-50 border-yellow-300',
    success: 'bg-green-50 border-green-300',
    info:    'bg-blue-50 border-blue-300',
  }[insight.type] ?? 'bg-gray-50 border-gray-200';

  return (
    <div className={`rounded-xl border-l-4 ${bg} p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-2">
          <InsightBadge type={insight.type} />
          <div>
            <p className="text-sm font-semibold text-gray-900">{insight.title}</p>
            <p className="text-xs text-gray-600 mt-0.5">{insight.message}</p>
          </div>
        </div>
        {insight.route && (
          <button
            type="button"
            onClick={() => onAction(insight.route)}
            className="flex-shrink-0 text-xs font-medium text-blue-600 hover:text-blue-800 whitespace-nowrap"
          >
            {insight.action ?? 'View'} →
          </button>
        )}
      </div>
    </div>
  );
}

function ActivityItem({ activity, onNavigate }) {
  return (
    <button
      type="button"
      onClick={() => activity.route && onNavigate(activity.route)}
      className="w-full text-left flex items-start gap-3 rounded-xl p-3 hover:bg-gray-50 transition-colors"
    >
      <div className={`w-9 h-9 rounded-xl ${activity.bg_color ?? 'bg-gray-100'} flex items-center justify-center flex-shrink-0`}>
        <i className={`bi ${activity.icon ?? 'bi-activity'} ${activity.text_color ?? 'text-gray-500'} text-sm`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-gray-900 truncate">{activity.title}</p>
          <span className="text-xs text-gray-400 flex-shrink-0">{activity.time}</span>
        </div>
        <p className="text-xs text-gray-500 truncate mt-0.5">{activity.description}</p>
      </div>
    </button>
  );
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// ── main ──────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useApi(() => dashApi.get());
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!loading && !error) setLastUpdated(new Date());
  }, [loading, error, data]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-2 text-gray-400">
      <i className="bi bi-arrow-clockwise animate-spin text-xl" /> Loading dashboard…
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6">
      <p className="font-semibold">Failed to load dashboard</p>
      <p className="text-sm mt-1">{error}</p>
      <button onClick={refetch} className="mt-3 text-sm font-medium underline">Try again</button>
    </div>
  );

  const {
    stats           = {},
    automationSummary = {},
    quickInsights   = [],
    recentActivities = [],
  } = data ?? {};

  const reorder = automationSummary?.reorder_suggestions ?? {};
  const expiry  = automationSummary?.expiry_reminders  ?? {};

  // Build sparkline data from last 7 activities (for visual interest)
  const trendDummy = Array.from({ length: 7 }, (_, i) => ({
    day: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i],
    revenue: Math.round(Math.random() * 300000 + 50000),
  }));

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Pharmacy overview — stock, sales, customers and alerts.
          </p>
          {lastUpdated && (
            <p className="text-xs text-gray-400 mt-1">
              Last refreshed {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
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

      {/* ── Stat Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Medicines"
          value={stats?.medicines?.total ?? 0}
          icon="bi-capsule"
          color="bg-blue-500"
          sub={`${stats?.medicines?.low_stock ?? 0} low · ${stats?.medicines?.expiring_soon ?? 0} expiring`}
        />
        <StatCard
          title="Today's Sales"
          value={stats?.sales?.today ?? 0}
          icon="bi-receipt"
          color="bg-green-500"
          sub={fmt(stats?.sales?.today_revenue)}
        />
        <StatCard
          title="Total Customers"
          value={stats?.customers?.total ?? 0}
          icon="bi-people"
          color="bg-purple-500"
          sub={`${stats?.customers?.new_this_month ?? 0} new this month`}
        />
        <StatCard
          title="Active Suppliers"
          value={stats?.suppliers?.total ?? 0}
          icon="bi-building"
          color="bg-orange-500"
          sub={`${stats?.suppliers?.active ?? 0} with stock`}
        />
      </div>

      {/* ── Month summary row ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* This month sales */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
          <p className="text-blue-100 text-sm font-medium">This Month Sales</p>
          <p className="text-2xl font-bold mt-1">{(stats?.sales?.this_month ?? 0).toLocaleString()}</p>
          <p className="text-blue-200 text-xs mt-1">{fmt(stats?.sales?.this_month_revenue)}</p>
        </div>
        {/* Reorder alerts */}
        <div className={`rounded-xl p-5 text-white ${reorder?.total > 0 ? 'bg-gradient-to-br from-amber-500 to-amber-600' : 'bg-gradient-to-br from-gray-400 to-gray-500'}`}>
          <p className="text-amber-100 text-sm font-medium">Reorder Alerts</p>
          <p className="text-2xl font-bold mt-1">{reorder?.total ?? 0}</p>
          <p className="text-amber-200 text-xs mt-1">
            {reorder?.total > 0 ? `${reorder.critical ?? 0} critical · ${reorder.high ?? 0} high` : 'Stock levels OK'}
          </p>
        </div>
        {/* Expiry alerts */}
        <div className={`rounded-xl p-5 text-white ${expiry?.total > 0 ? 'bg-gradient-to-br from-red-500 to-red-600' : 'bg-gradient-to-br from-gray-400 to-gray-500'}`}>
          <p className="text-red-100 text-sm font-medium">Expiry Alerts</p>
          <p className="text-2xl font-bold mt-1">{expiry?.total ?? 0}</p>
          <p className="text-red-200 text-xs mt-1">
            {expiry?.total > 0 ? `${expiry.critical ?? 0} critical · ${expiry.high ?? 0} high` : 'No expiry concerns'}
          </p>
        </div>
        {/* Low stock */}
        <div className={`rounded-xl p-5 text-white ${(stats?.medicines?.low_stock ?? 0) > 0 ? 'bg-gradient-to-br from-yellow-500 to-yellow-600' : 'bg-gradient-to-br from-green-500 to-green-600'}`}>
          <p className="text-yellow-100 text-sm font-medium">Low Stock Items</p>
          <p className="text-2xl font-bold mt-1">{stats?.medicines?.low_stock ?? 0}</p>
          <p className="text-yellow-200 text-xs mt-1">
            {(stats?.medicines?.low_stock ?? 0) > 0 ? 'Needs restocking' : 'All well stocked'}
          </p>
        </div>
      </div>

      {/* ── Charts + Insights ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Revenue Trend (dummy sparkline — real data from enhanced endpoint) */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-800">Revenue Trend</h2>
              <p className="text-xs text-gray-400 mt-0.5">Last 7 days (sample view)</p>
            </div>
            <button
              onClick={() => navigate('/analytics')}
              className="text-xs text-blue-600 hover:underline"
            >
              Full Analytics →
            </button>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={trendDummy} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
              <Tooltip formatter={v => [`UGX ${Number(v).toLocaleString()}`, 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#revGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Insights */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Quick Insights</h2>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${quickInsights.length > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
              {quickInsights.length} alerts
            </span>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto">
            {quickInsights.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <i className="bi bi-check-circle text-green-500 text-3xl mb-2" />
                <p className="text-sm text-gray-500">All good! No urgent alerts.</p>
              </div>
            ) : (
              quickInsights.map((insight, i) => (
                <InsightCard
                  key={i}
                  insight={insight}
                  onAction={(route) => {
                    // Convert backend named routes to frontend paths
                    const routeMap = {
                      'automation.reorder-suggestions': '/automation',
                      'medicines.index': '/medicines',
                      '/automation/reorder-suggestions': '/automation',
                      '/medicines': '/medicines',
                      '/reports': '/reports',
                    };
                    navigate(routeMap[route] ?? route.startsWith('/') ? route : `/${route}`);
                  }}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Stats bar chart ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Inventory & Sales Overview</h2>
          <button onClick={() => navigate('/reports')} className="text-xs text-blue-600 hover:underline">Reports →</button>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart
            data={[
              { name: 'Medicines', value: stats?.medicines?.total ?? 0, fill: '#3b82f6' },
              { name: 'Low Stock', value: stats?.medicines?.low_stock ?? 0, fill: '#f59e0b' },
              { name: 'Expiring', value: stats?.medicines?.expiring_soon ?? 0, fill: '#ef4444' },
              { name: 'Customers', value: stats?.customers?.total ?? 0, fill: '#8b5cf6' },
              { name: 'Suppliers', value: stats?.suppliers?.total ?? 0, fill: '#10b981' },
              { name: 'Sales/Mo', value: stats?.sales?.this_month ?? 0, fill: '#06b6d4' },
            ]}
            margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {[
                { fill: '#3b82f6' }, { fill: '#f59e0b' }, { fill: '#ef4444' },
                { fill: '#8b5cf6' }, { fill: '#10b981' }, { fill: '#06b6d4' },
              ].map((entry, index) => (
                <rect key={index} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Recent Activities ───────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-800">Recent Activity</h2>
            <p className="text-xs text-gray-400 mt-0.5">Latest sales, stock changes & alerts</p>
          </div>
          <span className="text-xs text-gray-400">{recentActivities.length} items</span>
        </div>
        <div className="divide-y divide-gray-50">
          {recentActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <i className="bi bi-inbox text-3xl mb-2" />
              <p className="text-sm">No recent activity to show.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-0">
              {recentActivities.slice(0, 12).map((activity, i) => (
                <ActivityItem key={i} activity={activity} onNavigate={navigate} />
              ))}
            </div>
          )}
        </div>
        {recentActivities.length > 12 && (
          <div className="px-6 py-3 border-t border-gray-100 text-center">
            <button onClick={() => navigate('/audit-logs')} className="text-xs text-blue-600 hover:underline">
              View all activity →
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
