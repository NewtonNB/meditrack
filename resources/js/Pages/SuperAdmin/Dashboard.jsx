import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import 'bootstrap-icons/font/bootstrap-icons.css';

export default function SuperAdminDashboard({
  stats = {},
  recentPharmacies = [],
  overduePayments = [],
  topPharmacies = [],
}) {
  // Safe defaults for stats
  const safeStats = {
    total_pharmacies: stats?.total_pharmacies || 0,
    active_pharmacies: stats?.active_pharmacies || 0,
    total_users: stats?.total_users || 0,
    total_sales: stats?.total_sales || 0,
    total_medicines: stats?.total_medicines || 0,
    monthly_revenue: stats?.monthly_revenue || 0,
  };

  const statCards = [
    {
      label: 'Total Pharmacies',
      value: safeStats.total_pharmacies,
      color: 'from-blue-100 to-blue-300',
      text: 'text-blue-800',
      icon: 'bi-building',
    },
    {
      label: 'Active Pharmacies',
      value: safeStats.active_pharmacies,
      color: 'from-green-100 to-green-300',
      text: 'text-green-800',
      icon: 'bi-check-circle',
    },
    {
      label: 'Total Users',
      value: safeStats.total_users,
      color: 'from-purple-100 to-purple-300',
      text: 'text-purple-800',
      icon: 'bi-people',
    },
    {
      label: 'Monthly Revenue',
      value: `UGX ${Number(safeStats.monthly_revenue || 0).toLocaleString()}`,
      color: 'from-yellow-100 to-yellow-300',
      text: 'text-yellow-800',
      icon: 'bi-cash-stack',
    },
    {
      label: 'Total Sales',
      value: `UGX ${Number(safeStats.total_sales || 0).toLocaleString()}`,
      color: 'from-indigo-100 to-indigo-300',
      text: 'text-indigo-800',
      icon: 'bi-graph-up',
    },
    {
      label: 'Total Medicines',
      value: safeStats.total_medicines,
      color: 'from-pink-100 to-pink-300',
      text: 'text-pink-800',
      icon: 'bi-capsule',
    },
  ];

  return (
    <AuthenticatedLayout
      header={
        <h2 className="text-xl font-semibold leading-tight text-gray-800">Super Admin Dashboard</h2>
      }
    >
      <Head title="Super Admin Dashboard" />
      <div className="p-0">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome to Control Tower</h1>
              <p className="text-indigo-100">
                Manage all your pharmacy clients from one central location
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">{safeStats.total_pharmacies}</div>
              <div className="text-indigo-200">Pharmacies Managed</div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statCards.map(item => (
            <div
              key={item.label}
              className={`bg-gradient-to-br ${item.color} rounded-xl shadow p-6 border border-gray-200`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-gray-600 text-sm font-medium">{item.label}</div>
                  <div className={`text-2xl font-bold mt-1 ${item.text}`}>{item.value}</div>
                </div>
                <i className={`bi ${item.icon} text-3xl ${item.text} opacity-60`}></i>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Pharmacies */}
          <div className="bg-white rounded-2xl shadow p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Recent Pharmacies</h2>
              <a
                href="/superadmin/pharmacies"
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              >
                View All
              </a>
            </div>
            <div className="space-y-4">
              {recentPharmacies.map(pharmacy => (
                <div
                  key={pharmacy.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-gray-900">{pharmacy.name}</div>
                    <div className="text-sm text-gray-500">{pharmacy.email}</div>
                    <div className="text-xs text-gray-400">{pharmacy.created_at}</div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        pharmacy.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : pharmacy.status === 'suspended'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {pharmacy.status}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">{pharmacy.subscription_plan}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Overdue Payments */}
          <div className="bg-white rounded-2xl shadow p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Overdue Payments</h2>
              <a
                href="/superadmin/payments"
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              >
                View All
              </a>
            </div>
            <div className="space-y-4">
              {overduePayments.length > 0 ? (
                overduePayments.map(payment => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200"
                  >
                    <div>
                      <div className="font-medium text-gray-900">{payment.pharmacy.name}</div>
                      <div className="text-sm text-gray-500">Due: {payment.due_date}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-red-600">UGX {Number(payment.amount).toLocaleString()}</div>
                      <div className="text-xs text-red-500">Overdue</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <i className="bi bi-check-circle text-4xl text-green-500 mb-2"></i>
                  <div>No overdue payments</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Performing Pharmacies */}
        <div className="mt-8 bg-white rounded-2xl shadow p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Top Performing Pharmacies</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pharmacy
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Sales
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Users
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topPharmacies.map(pharmacy => (
                  <tr key={pharmacy.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{pharmacy.name}</div>
                      <div className="text-sm text-gray-500">{pharmacy.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          pharmacy.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : pharmacy.status === 'suspended'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {pharmacy.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                      {pharmacy.subscription_plan}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      UGX {Number(pharmacy.sales_sum_total_price || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {pharmacy.users_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
