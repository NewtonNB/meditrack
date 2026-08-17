import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { analytics as api } from '../api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { SkeletonStatCard } from '../Components/Skeleton';

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f43f5e'];
const PERIODS    = ['daily', 'weekly', 'monthly', 'yearly'];

function StatCard({ label, value, icon, color }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
      <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
        <i className={`bi ${icon} text-white text-xl`} />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function SectionCard({ title, children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 ${className}`}>
      <h2 className="font-semibold text-gray-800 mb-4">{title}</h2>
      {children}
    </div>
  );
}

export default function Analytics() {
  const [period, setPeriod] = useState('monthly');

  const summary        = useApi(() => api.summary());
  const salesTrends    = useApi(() => api.salesTrends({ period }), [period]);
  const bestSelling    = useApi(() => api.bestSelling());
  const paymentMethods = useApi(() => api.paymentMethods());
  const customerData   = useApi(() => api.customerAnalytics());
  const stockSummary   = useApi(() => api.stockSummary());
  const expiringMeds   = useApi(() => api.expiringMedicines({ days: 30 }));

  const stats    = summary.data?.summary ?? summary.data ?? {};
  const trends   = salesTrends.data?.trends ?? salesTrends.data?.data ?? salesTrends.data ?? [];
  const topMeds  = bestSelling.data?.medicines ?? bestSelling.data?.data ?? bestSelling.data ?? [];
  const payments = (() => {
    const raw = paymentMethods.data?.payment_methods ?? paymentMethods.data?.data ?? paymentMethods.data ?? [];
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object') return Object.entries(raw).map(([name, value]) => ({ name, value: Number(value) }));
    return [];
  })();
  const custData  = customerData.data?.customers ?? customerData.data ?? {};
  const stock     = stockSummary.data?.stock ?? stockSummary.data ?? {};
  const expiring  = (() => {
    const raw = expiringMeds.data?.expiring?.items ?? expiringMeds.data?.expiring ?? expiringMeds.data?.data ?? expiringMeds.data ?? [];
    return Array.isArray(raw) ? raw : [];
  })();

  const fmt = (n) => `UGX ${Number(n ?? 0).toLocaleString()}`;
  const loading = summary.loading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Business performance and insights</p>
        </div>
        {/* Period switcher */}
        <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
          {PERIODS.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md capitalize transition-colors ${
                period === p ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPI stat cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0,1,2,3].map(i => <SkeletonStatCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Revenue"    value={fmt(stats.total_sales ?? stats.total_revenue)}   icon="bi-currency-dollar" color="bg-green-500"  />
          <StatCard label="Monthly Sales"    value={fmt(stats.monthly_sales ?? stats.today?.revenue)} icon="bi-receipt"         color="bg-blue-500"   />
          <StatCard label="Total Customers"  value={stats.total_customers ?? 0}                       icon="bi-people"          color="bg-purple-500" />
          <StatCard label="Low Stock Items"  value={stats.low_stock_count ?? 0}                       icon="bi-exclamation-triangle" color="bg-orange-500" />
        </div>
      )}

      {/* Sales Trends (full width) */}
      <SectionCard title={`Sales Trends — ${period.charAt(0).toUpperCase() + period.slice(1)}`}>
        {salesTrends.loading ? (
          <div className="h-48 skeleton-shimmer rounded-lg" />
        ) : trends.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={trends}>
              <XAxis dataKey={trends[0]?.period !== undefined ? 'period' : trends[0]?.date !== undefined ? 'date' : 'day'} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => [`UGX ${Number(v).toLocaleString()}`, 'Revenue']} />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No trend data for this period.</div>
        )}
      </SectionCard>

      {/* Best Selling + Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Best Selling Medicines">
          {bestSelling.loading ? (
            <div className="h-48 skeleton-shimmer rounded-lg" />
          ) : topMeds.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topMeds.slice(0, 8)} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={90} />
                <Tooltip />
                <Bar dataKey="quantity_sold" name="Units Sold" fill="#3b82f6" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data available.</div>
          )}
        </SectionCard>

        <SectionCard title="Payment Methods">
          {paymentMethods.loading ? (
            <div className="h-48 skeleton-shimmer rounded-lg" />
          ) : payments.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={payments} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                  {payments.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => Number(v).toLocaleString()} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No payment data available.</div>
          )}
        </SectionCard>
      </div>

      {/* Stock Summary */}
      {!stockSummary.loading && (
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Stock Overview</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Medicines', value: stock.total_medicines ?? stock.total_items ?? 0,   icon: 'bi-capsule',            color: 'bg-blue-500' },
              { label: 'Low Stock',       value: stock.low_stock ?? stock.low_stock_items ?? 0,     icon: 'bi-exclamation-triangle', color: 'bg-yellow-500' },
              { label: 'Out of Stock',    value: stock.out_of_stock ?? stock.out_of_stock_items ?? 0, icon: 'bi-slash-circle',       color: 'bg-red-500' },
              { label: 'Expiring Soon',   value: stock.expiring_soon ?? stock.expiring_batches ?? 0, icon: 'bi-clock',              color: 'bg-orange-500' },
            ].map(c => <StatCard key={c.label} {...c} />)}
          </div>
        </div>
      )}

      {/* Customer Analytics */}
      {!customerData.loading && (custData.new_customers_this_month !== undefined || custData.top_customers?.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SectionCard title="Customer Insights">
            <div className="space-y-3">
              {[
                { label: 'New This Month',      value: custData.new_customers_this_month ?? 0 },
                { label: 'Returning Customers', value: custData.returning_customers ?? 0 },
                { label: 'Total Customers',     value: custData.total_customers ?? 0 },
                { label: 'Avg Spend per Visit', value: fmt(custData.avg_spend_per_visit) },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-600">{label}</span>
                  <span className="text-sm font-semibold text-gray-900">{value}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          {custData.top_customers?.length > 0 && (
            <SectionCard title="Top Customers">
              <div className="space-y-2">
                {custData.top_customers.slice(0, 5).map((c, i) => (
                  <div key={c.id ?? i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">{i+1}</span>
                      <span className="text-sm text-gray-700">{c.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{fmt(c.total_spent)}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </div>
      )}

      {/* Expiring Medicines Alert */}
      {!expiringMeds.loading && expiring.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <i className="bi bi-exclamation-triangle-fill text-amber-500 text-lg" />
            <h2 className="font-semibold text-amber-800">{expiring.length} Medicine{expiring.length !== 1 ? 's' : ''} Expiring Within 30 Days</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {expiring.slice(0, 6).map((m, i) => (
              <div key={m.id ?? i} className="bg-white rounded-lg px-3 py-2 border border-amber-100 text-sm">
                <p className="font-medium text-gray-900">{m.name ?? m.medicine?.name ?? 'Unknown'}</p>
                <p className="text-amber-700 text-xs mt-0.5">Expires: {m.expiry_date ? new Date(m.expiry_date).toLocaleDateString() : '—'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
