import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { dashboard } from '../api';

function StatCard({ title, value, icon, color, sub }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500">{title}</p>
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
          <i className={`bi ${icon} text-white`} />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value ?? '—'}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function SummaryCard({ title, value, subtitle, icon, color }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value ?? '—'}</p>
        </div>
        <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center`}>
          <i className={`bi ${icon} text-white text-lg`} />
        </div>
      </div>
      {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
    </div>
  );
}

function InsightCard({ insight, onAction }) {
  const variant = insight.type === 'danger' ? 'bg-red-50 border-red-400 text-red-700' :
    insight.type === 'warning' ? 'bg-yellow-50 border-yellow-400 text-yellow-700' :
    'bg-green-50 border-green-400 text-green-700';

  return (
    <div className={`rounded-2xl border-l-4 ${variant} p-4 shadow-sm`}> 
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">{insight.title}</p>
          <p className="text-xs text-gray-600 mt-1">{insight.message}</p>
        </div>
        {insight.route && (
          <button
            type="button"
            onClick={() => onAction(insight.route)}
            className="inline-flex items-center rounded-lg bg-white border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            {insight.action || 'View'}
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
      className="w-full text-left rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:bg-gray-50"
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-2xl ${activity.bg_color} flex items-center justify-center`}>
          <i className={`bi ${activity.icon} ${activity.text_color} text-base`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-semibold text-gray-900">{activity.title}</p>
            <span className="text-xs text-gray-400">{activity.time}</span>
          </div>
          <p className="text-sm text-gray-500 mt-1 truncate">{activity.description}</p>
          {activity.details && <p className="text-xs text-gray-400 mt-2">{activity.details}</p>}
        </div>
      </div>
    </button>
  );
}

function formatUgx(value) {
  return `UGX ${Number(value ?? 0).toLocaleString()}`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useApi(() => dashboard.get());
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    if (!loading && !error) {
      setLastUpdated(new Date());
    }
  }, [loading, error, data]);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading dashboard…</div>;
  if (error) return <div className="text-red-500 p-4">{error}</div>;

  const {
    stats = {},
    automationSummary = {},
    quickInsights = [],
    recentActivities = [],
  } = data ?? {};

  const reorder = automationSummary?.reorder_suggestions ?? {};
  const expiry = automationSummary?.expiry_reminders ?? {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Overview of stock, sales, customers, and automation alerts.</p>
          {lastUpdated && (
            <p className="text-xs text-gray-400 mt-2">Last refreshed {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          )}
        </div>
        <button
          type="button"
          onClick={refetch}
          disabled={loading}
          className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
        >
          {loading ? (
            <>
              <i className="bi bi-arrow-clockwise animate-spin mr-2" /> Refreshing...
            </>
          ) : (
            'Refresh'
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Medicines"
          value={stats?.medicines?.total}
          icon="bi-capsule"
          color="bg-blue-500"
          sub={`${stats?.medicines?.low_stock ?? 0} low stock · ${stats?.medicines?.expiring_soon ?? 0} expiring soon`}
        />
        <StatCard
          title="Today's Sales"
          value={stats?.sales?.today}
          icon="bi-receipt"
          color="bg-green-500"
          sub={`${formatUgx(stats?.sales?.today_revenue)} revenue`}
        />
        <StatCard
          title="Total Customers"
          value={stats?.customers?.total}
          icon="bi-people"
          color="bg-purple-500"
          sub={`${stats?.customers?.new_this_month ?? 0} new this month`}
        />
        <StatCard
          title="Active Suppliers"
          value={stats?.suppliers?.total}
          icon="bi-building"
          color="bg-orange-500"
          sub={`${stats?.suppliers?.active ?? 0} active`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SummaryCard
            title="Reorder Suggestions"
            value={reorder?.total}
            icon="bi-cart-plus"
            color="bg-sky-500"
            subtitle={reorder?.total > 0 ? `${reorder.critical ?? 0} critical · ${reorder.high ?? 0} high` : 'No urgent reorder needs detected'}
          />
          <SummaryCard
            title="Expiry Reminders"
            value={expiry?.total}
            icon="bi-clock"
            color="bg-amber-500"
            subtitle={expiry?.total > 0 ? `${expiry.critical ?? 0} critical · ${expiry.high ?? 0} high` : 'Expiry levels under control'}
          />
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-800">Quick Insights</h2>
              <p className="text-sm text-gray-500">Actionable alerts to keep the pharmacy running smoothly.</p>
            </div>
            <span className="text-xs uppercase tracking-wide text-gray-400">{quickInsights.length} alerts</span>
          </div>

          {quickInsights.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
              No urgent insights at the moment.
            </div>
          ) : (
            <div className="space-y-3">
              {quickInsights.map((insight, index) => (
                <InsightCard key={index} insight={insight} onAction={route => navigate(route)} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-800">Recent Activities</h2>
            <p className="text-sm text-gray-500">Latest sales, inventory updates, and system alerts.</p>
          </div>
          <span className="text-sm text-gray-500">{recentActivities.length} items</span>
        </div>

        {recentActivities.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
            No recent activity to show.
          </div>
        ) : (
          <div className="grid gap-3">
            {recentActivities.map((activity, index) => (
              <ActivityItem key={index} activity={activity} onNavigate={navigate} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
