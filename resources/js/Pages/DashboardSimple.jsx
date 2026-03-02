import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function DashboardSimple({ stats = {}, recentActivities = [], quickInsights = [] }) {
  // Safe stats with defaults
  const safeStats = {
    medicines: stats?.medicines || { total: 0, low_stock: 0, expiring_soon: 0 },
    sales: stats?.sales || { today: 0, today_revenue: 0, this_month: 0, this_month_revenue: 0 },
    customers: stats?.customers || { total: 0, new_this_month: 0 },
    suppliers: stats?.suppliers || { total: 0, active: 0 },
  };

  return (
    <AuthenticatedLayout>
      <Head>
        <title>Dashboard - MediTrack</title>
      </Head>

      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6 text-gray-900">
              <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Medicines */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-green-800">Total Medicines</h3>
                  <p className="text-3xl font-bold text-green-900">{safeStats.medicines.total}</p>
                  <p className="text-sm text-green-600">{safeStats.medicines.low_stock} low stock</p>
                </div>

                {/* Sales */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-800">Today's Sales</h3>
                  <p className="text-3xl font-bold text-blue-900">UGX {safeStats.sales.today_revenue.toLocaleString()}</p>
                  <p className="text-sm text-blue-600">{safeStats.sales.today} transactions</p>
                </div>

                {/* Customers */}
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-purple-800">Customers</h3>
                  <p className="text-3xl font-bold text-purple-900">{safeStats.customers.total}</p>
                  <p className="text-sm text-purple-600">{safeStats.customers.new_this_month} new this month</p>
                </div>

                {/* Suppliers */}
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-orange-800">Suppliers</h3>
                  <p className="text-3xl font-bold text-orange-900">{safeStats.suppliers.total}</p>
                  <p className="text-sm text-orange-600">{safeStats.suppliers.active} active</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <a href="/medicines" className="bg-blue-500 text-white p-4 rounded-lg text-center hover:bg-blue-600">
                  Medicines
                </a>
                <a href="/sales" className="bg-green-500 text-white p-4 rounded-lg text-center hover:bg-green-600">
                  Sales
                </a>
                <a href="/customers" className="bg-purple-500 text-white p-4 rounded-lg text-center hover:bg-purple-600">
                  Customers
                </a>
                <a href="/suppliers" className="bg-orange-500 text-white p-4 rounded-lg text-center hover:bg-orange-600">
                  Suppliers
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
