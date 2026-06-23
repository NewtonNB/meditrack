import { useApi } from '../hooks/useApi';
import { system } from '../api';

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

function GrowthBadge({ value }) {
  const num = Number(value);
  if (!num) return <span className="text-xs text-gray-400">No change</span>;
  const positive = num > 0;
  return (
    <span className={`text-xs font-medium ${positive ? 'text-green-600' : 'text-red-600'}`}>
      {positive ? '+' : ''}{num}%
    </span>
  );
}

const healthStyles = {
  excellent: 'bg-green-100 text-green-700 border-green-200',
  good:      'bg-blue-100 text-blue-700 border-blue-200',
  fair:      'bg-yellow-100 text-yellow-700 border-yellow-200',
  poor:      'bg-red-100 text-red-700 border-red-200',
};

function formatUgx(amount) {
  return `UGX ${Number(amount ?? 0).toLocaleString()}`;
}

export default function SystemOverview() {
  const { data, loading, error } = useApi(() => system.stats());
  const stats = data?.stats ?? {};
  const systemHealth = data?.systemHealth ?? 'unknown';
  const lastUpdated = data?.lastUpdated;

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading system overview…</div>;
  if (error)   return <div className="text-red-500 p-4">{error}</div>;

  const healthClass = healthStyles[systemHealth] ?? 'bg-gray-100 text-gray-700 border-gray-200';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Overview</h1>
          {lastUpdated && (
            <p className="text-sm text-gray-400 mt-1">
              Last updated {new Date(lastUpdated).toLocaleString()}
            </p>
          )}
        </div>
        <span className={`px-4 py-2 rounded-full text-sm font-semibold capitalize border ${healthClass}`}>
          System health: {systemHealth}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Medicines"
          value={stats.totalMedicines}
          icon="bi-capsule"
          color="bg-blue-500"
          sub={<><GrowthBadge value={stats.medicinesGrowth} /> · {stats.lowStockMedicines ?? 0} low stock</>}
        />
        <StatCard
          title="Total Customers"
          value={stats.totalCustomers}
          icon="bi-people"
          color="bg-purple-500"
          sub={<><GrowthBadge value={stats.customersGrowth} /> · {stats.newCustomersThisMonth ?? 0} new this month</>}
        />
        <StatCard
          title="Total Sales"
          value={stats.totalSales}
          icon="bi-receipt"
          color="bg-green-500"
          sub={<GrowthBadge value={stats.salesGrowth} />}
        />
        <StatCard
          title="Total Revenue"
          value={formatUgx(stats.totalRevenue)}
          icon="bi-currency-dollar"
          color="bg-orange-500"
          sub={<GrowthBadge value={stats.revenueGrowth} />}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Sales"
          value={stats.todaySales}
          icon="bi-cart-check"
          color="bg-teal-500"
          sub={formatUgx(stats.todayRevenue)}
        />
        <StatCard
          title="Low Stock Items"
          value={stats.lowStockMedicines}
          icon="bi-exclamation-triangle"
          color="bg-yellow-500"
          sub="Medicines with stock ≤ 10"
        />
        <StatCard
          title="Active Suppliers"
          value={stats.activeSuppliers}
          icon="bi-building"
          color="bg-indigo-500"
        />
        <StatCard
          title="New Customers"
          value={stats.newCustomersThisMonth}
          icon="bi-person-plus"
          color="bg-pink-500"
          sub="This month"
        />
      </div>
    </div>
  );
}
