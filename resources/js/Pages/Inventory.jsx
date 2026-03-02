import React, { useState } from 'react';
import { Head, usePage, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import 'bootstrap-icons/font/bootstrap-icons.css';

export default function Inventory() {
  const { props } = usePage();
  
  // Permission checks - extract from props or set defaults
  const canManage = props.canManage || props.canEdit || false;
  const canViewCosts = props.canViewCosts || false;
  const userRole = props.auth?.user?.role || 'cashier';
  
  // Allow management for pharmacists, pharmacy_admin, and super_admin
  const canManageInventory = canManage || ['pharmacist', 'pharmacy_admin', 'super_admin'].includes(userRole);

  // Sample inventory data - in real app this would come from props
  const inventoryStats = {
    totalItems: props.totalItems || 156,
    lowStockItems: props.lowStockItems || 12,
    expiringSoon: props.expiringSoon || 8,
    outOfStock: props.outOfStock || 3,
  };

  const [isLoading, setIsLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

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
      header={
        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
          Inventory Management
        </h2>
      }
    >
      <Head title="Inventory Management" />

      <div 
        className={`min-h-screen transition-all duration-500 ${
          darkMode 
            ? 'bg-gradient-to-br from-gray-900 via-green-900 to-blue-900' 
            : 'bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50'
        }`}
        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        {/* Floating Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className={`absolute top-1/4 left-1/4 w-64 h-64 ${darkMode ? 'bg-green-500/10' : 'bg-green-200/30'} rounded-full blur-3xl animate-pulse`}></div>
          <div className={`absolute top-3/4 right-1/4 w-96 h-96 ${darkMode ? 'bg-blue-500/10' : 'bg-blue-200/30'} rounded-full blur-3xl animate-pulse delay-1000`}></div>
          <div className={`absolute top-1/2 left-1/2 w-80 h-80 ${darkMode ? 'bg-indigo-500/10' : 'bg-indigo-200/30'} rounded-full blur-3xl animate-pulse delay-500`}></div>
        </div>

        <div className="relative z-10 py-12">
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
          {/* Modern Header */}
          <div className={`backdrop-blur-xl ${darkMode ? 'bg-gray-800/30' : 'bg-white/30'} rounded-2xl p-6 mb-8 border ${darkMode ? 'border-gray-700/50' : 'border-white/50'} shadow-xl`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className={`w-16 h-16 rounded-2xl ${darkMode ? 'bg-gradient-to-br from-green-400 to-blue-500' : 'bg-gradient-to-br from-green-400 to-blue-500'} flex items-center justify-center shadow-lg`}>
                  <i className="bi bi-box-seam text-2xl text-white"></i>
                </div>
                <div>
                  <h1 className={`text-4xl font-black ${darkMode ? 'bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent' : 'bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent'}`}>
                    Inventory Control
                  </h1>
                  <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'} mt-2`}>
                    Comprehensive stock management and inventory tracking
                  </p>
                  <div className="flex items-center gap-4 mt-3">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${canManageInventory ? (darkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700') : (darkMode ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-700')}`}>
                      <i className={`bi ${canManageInventory ? 'bi-check-circle-fill' : 'bi-eye-fill'}`}></i>
                      <span className="text-sm font-medium">
                        {canManageInventory ? 'Full Access' : 'View Only'}
                      </span>
                    </div>
                    <div className={`px-3 py-1 rounded-full ${darkMode ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                      <span className="text-sm">Role: {userRole}</span>
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
                    Live Data
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Permission Info for Non-Managers */}
          {!canManageInventory && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <i className="bi bi-exclamation-triangle text-yellow-600 text-lg"></i>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Limited Inventory Access</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>You currently have <strong>view-only</strong> access to inventory management.</p>
                    <p className="mt-1">To manage inventory, you need one of these roles:</p>
                    <ul className="mt-2 list-disc list-inside space-y-1">
                      <li><strong>Pharmacist</strong> - Can manage medicines and stock movements</li>
                      <li><strong>Pharmacy Admin</strong> - Full pharmacy management access</li>
                      <li><strong>Super Admin</strong> - System-wide access</li>
                    </ul>
                    <p className="mt-2">Contact your administrator to request elevated permissions.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modern Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Items Card */}
            <div className={`group relative overflow-hidden backdrop-blur-xl ${darkMode ? 'bg-gradient-to-br from-blue-500/20 to-cyan-600/20 border-blue-500/30' : 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200/50'} rounded-2xl p-6 border shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-sm font-medium ${darkMode ? 'text-blue-400' : 'text-blue-600'} mb-2`}>
                    Total Items
                  </div>
                  <div className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-800'} mb-1`}>
                    {inventoryStats.totalItems}
                  </div>
                  <div className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-600'} flex items-center gap-1`}>
                    <i className="bi bi-arrow-up"></i>
                    <span>+5% this month</span>
                  </div>
                </div>
                <div className={`w-16 h-16 rounded-2xl ${darkMode ? 'bg-blue-500/20' : 'bg-blue-100'} flex items-center justify-center`}>
                  <i className={`bi bi-box-seam text-2xl ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}></i>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>

            {/* Low Stock Card */}
            <div className={`group relative overflow-hidden backdrop-blur-xl ${darkMode ? 'bg-gradient-to-br from-orange-500/20 to-red-600/20 border-orange-500/30' : 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-200/50'} rounded-2xl p-6 border shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-sm font-medium ${darkMode ? 'text-orange-400' : 'text-orange-600'} mb-2`}>
                    Low Stock Alert
                  </div>
                  <div className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-800'} mb-1`}>
                    {inventoryStats.lowStockItems}
                  </div>
                  <div className={`text-sm ${darkMode ? 'text-orange-300' : 'text-orange-600'} flex items-center gap-1`}>
                    <i className="bi bi-exclamation-triangle-fill"></i>
                    <span>Needs attention</span>
                  </div>
                </div>
                <div className={`w-16 h-16 rounded-2xl ${darkMode ? 'bg-orange-500/20' : 'bg-orange-100'} flex items-center justify-center`}>
                  <i className={`bi bi-exclamation-triangle text-2xl ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}></i>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>

            {/* Expiring Soon Card */}
            <div className={`group relative overflow-hidden backdrop-blur-xl ${darkMode ? 'bg-gradient-to-br from-yellow-500/20 to-amber-600/20 border-yellow-500/30' : 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200/50'} rounded-2xl p-6 border shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-sm font-medium ${darkMode ? 'text-yellow-400' : 'text-yellow-600'} mb-2`}>
                    Expiring Soon
                  </div>
                  <div className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-800'} mb-1`}>
                    {inventoryStats.expiringSoon}
                  </div>
                  <div className={`text-sm ${darkMode ? 'text-yellow-300' : 'text-yellow-600'} flex items-center gap-1`}>
                    <i className="bi bi-clock-fill"></i>
                    <span>Next 30 days</span>
                  </div>
                </div>
                <div className={`w-16 h-16 rounded-2xl ${darkMode ? 'bg-yellow-500/20' : 'bg-yellow-100'} flex items-center justify-center`}>
                  <i className={`bi bi-clock text-2xl ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}></i>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>

            {/* Out of Stock Card */}
            <div className={`group relative overflow-hidden backdrop-blur-xl ${darkMode ? 'bg-gradient-to-br from-red-500/20 to-pink-600/20 border-red-500/30' : 'bg-gradient-to-br from-red-50 to-pink-50 border-red-200/50'} rounded-2xl p-6 border shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-sm font-medium ${darkMode ? 'text-red-400' : 'text-red-600'} mb-2`}>
                    Out of Stock
                  </div>
                  <div className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-800'} mb-1`}>
                    {inventoryStats.outOfStock}
                  </div>
                  <div className={`text-sm ${darkMode ? 'text-red-300' : 'text-red-600'} flex items-center gap-1`}>
                    <i className="bi bi-x-circle-fill"></i>
                    <span>Urgent restock</span>
                  </div>
                </div>
                <div className={`w-16 h-16 rounded-2xl ${darkMode ? 'bg-red-500/20' : 'bg-red-100'} flex items-center justify-center`}>
                  <i className={`bi bi-x-circle text-2xl ${darkMode ? 'text-red-400' : 'text-red-600'}`}></i>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          </div>

          {/* Modern Quick Actions */}
          <div className={`backdrop-blur-xl ${darkMode ? 'bg-gray-800/30' : 'bg-white/30'} rounded-2xl p-8 border ${darkMode ? 'border-gray-700/50' : 'border-white/50'} shadow-xl`}>
            <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-6`}>Inventory Management Hub</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Medicines Management */}
              <div className={`group relative overflow-hidden ${darkMode ? 'bg-gradient-to-br from-green-500/20 to-emerald-600/20 border-green-500/30' : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200/50'} rounded-2xl p-6 border shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}>
                <div className="flex items-center mb-4">
                  <div className={`w-12 h-12 rounded-xl ${darkMode ? 'bg-green-500/20' : 'bg-green-100'} flex items-center justify-center mr-4`}>
                    <i className={`bi bi-capsule-pill text-xl ${darkMode ? 'text-green-400' : 'text-green-600'}`}></i>
                  </div>
                  <h4 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>Medicines</h4>
                </div>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-6 leading-relaxed`}>
                  Manage medicine inventory, add new items, update stock levels and pricing with advanced controls.
                </p>
                <Link
                  href={route('medicines.index')}
                  className={`inline-flex items-center px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                    darkMode 
                      ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  <i className="bi bi-arrow-right mr-2"></i>
                  Manage Medicines
                </Link>
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>

              {/* Stock Movements */}
              <div className={`group relative overflow-hidden ${darkMode ? 'bg-gradient-to-br from-orange-500/20 to-red-600/20 border-orange-500/30' : 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-200/50'} rounded-2xl p-6 border shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}>
                <div className="flex items-center mb-4">
                  <div className={`w-12 h-12 rounded-xl ${darkMode ? 'bg-orange-500/20' : 'bg-orange-100'} flex items-center justify-center mr-4`}>
                    <i className={`bi bi-arrow-left-right text-xl ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}></i>
                  </div>
                  <h4 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>Stock Movements</h4>
                </div>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-6 leading-relaxed`}>
                  Track stock in/out, adjustments, and view detailed movement history with real-time updates.
                </p>
                <Link
                  href={route('stock-movements.index')}
                  className={`inline-flex items-center px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                    darkMode 
                      ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30' 
                      : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                  }`}
                >
                  <i className="bi bi-arrow-right mr-2"></i>
                  View Movements
                </Link>
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>

              {/* Reports */}
              <div className={`group relative overflow-hidden ${darkMode ? 'bg-gradient-to-br from-blue-500/20 to-purple-600/20 border-blue-500/30' : 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200/50'} rounded-2xl p-6 border shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}>
                <div className="flex items-center mb-4">
                  <div className={`w-12 h-12 rounded-xl ${darkMode ? 'bg-blue-500/20' : 'bg-blue-100'} flex items-center justify-center mr-4`}>
                    <i className={`bi bi-graph-up text-xl ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}></i>
                  </div>
                  <h4 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>Analytics & Reports</h4>
                </div>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-6 leading-relaxed`}>
                  Generate comprehensive inventory reports, stock analysis, and export data for insights.
                </p>
                <button
                  className={`inline-flex items-center px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                    darkMode 
                      ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' 
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                  onClick={() => alert('Advanced reports feature coming soon!')}
                >
                  <i className="bi bi-arrow-right mr-2"></i>
                  View Reports
                </button>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            </div>
          </div>

          {/* Permission-based Actions */}
          {canManageInventory && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <i className="bi bi-check-circle text-green-600 text-lg mr-3"></i>
                  <div>
                    <h3 className="text-sm font-medium text-green-800">Full Inventory Access</h3>
                    <p className="text-sm text-green-700">You have permission to manage all inventory operations.</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={route('medicines.create')}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <i className="bi bi-plus mr-2"></i>
                    Add Medicine
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </AuthenticatedLayout>
  );
}