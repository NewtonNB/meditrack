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

export default function Dashboard() {
  const { data, loading, error } = useApi(() => dashboard.get());

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading dashboard…</div>;
  if (error)   return <div className="text-red-500 p-4">{error}</div>;

  const { stats, recentActivities = [], quickInsights = [] } = data ?? {};

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Medicines"  value={stats?.medicines?.total}      icon="bi-capsule"       color="bg-blue-500"   sub={`${stats?.medicines?.low_stock ?? 0} low stock`} />
        <StatCard title="Today's Sales"    value={stats?.sales?.today}          icon="bi-receipt"       color="bg-green-500"  sub={`UGX ${(stats?.sales?.today_revenue ?? 0).toLocaleString()}`} />
        <StatCard title="Total Customers"  value={stats?.customers?.total}      icon="bi-people"        color="bg-purple-500" sub={`${stats?.customers?.new_this_month ?? 0} new this month`} />
        <StatCard title="Total Suppliers"  value={stats?.suppliers?.total}      icon="bi-building"      color="bg-orange-500" sub={`${stats?.suppliers?.active ?? 0} active`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Insights */}
        {quickInsights.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-4">Quick Insights</h2>
            <div className="space-y-3">
              {quickInsights.map((insight, i) => (
                <div key={i} className={`p-3 rounded-lg border-l-4 ${
                  insight.type === 'danger'  ? 'bg-red-50    border-red-400'    :
                  insight.type === 'warning' ? 'bg-yellow-50 border-yellow-400' :
                                               'bg-green-50  border-green-400'
                }`}>
                  <p className="text-sm font-medium text-gray-800">{insight.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{insight.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activities */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4">Recent Activities</h2>
          {recentActivities.length === 0 ? (
            <p className="text-sm text-gray-400">No recent activities.</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {recentActivities.map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg ${a.bg_color} flex items-center justify-center flex-shrink-0`}>
                    <i className={`bi ${a.icon} ${a.text_color} text-sm`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{a.title}</p>
                    <p className="text-xs text-gray-500 truncate">{a.description}</p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">{a.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
