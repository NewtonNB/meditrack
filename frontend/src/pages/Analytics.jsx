import { useApi } from '../hooks/useApi';
import { analytics as api } from '../api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function Analytics() {
  const summary      = useApi(() => api.summary());
  const salesTrends  = useApi(() => api.salesTrends({ period: 'monthly' }));
  const bestSelling  = useApi(() => api.bestSelling());

  if (summary.loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading analytics…</div>;

  const trendData   = salesTrends.data?.data  ?? salesTrends.data  ?? [];
  const topMeds     = bestSelling.data?.data   ?? bestSelling.data  ?? [];
  const stats       = summary.data ?? {};

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue',   value: `UGX ${Number(stats.total_revenue   ?? 0).toLocaleString()}` },
          { label: 'Total Sales',     value: stats.total_sales     ?? 0 },
          { label: 'Avg Order Value', value: `UGX ${Number(stats.avg_order_value ?? 0).toLocaleString()}` },
          { label: 'Total Customers', value: stats.total_customers  ?? 0 },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500">{c.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trends */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4">Sales Trends</h2>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData}>
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-gray-400">No trend data.</p>}
        </div>

        {/* Best Selling */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4">Best Selling Medicines</h2>
          {topMeds.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topMeds.slice(0, 6)}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="total_sold" fill="#3b82f6" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-gray-400">No data.</p>}
        </div>
      </div>
    </div>
  );
}
