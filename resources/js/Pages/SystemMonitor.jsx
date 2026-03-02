import React, { useState, useEffect } from 'react';
import { Head, usePage, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import 'bootstrap-icons/font/bootstrap-icons.css';

export default function ModernSystemMonitor() {
  const { props } = usePage();
  
  // Permission checks
  const userRole = props.auth?.user?.role || 'cashier';
  const canViewSystemData = ['pharmacy_admin', 'super_admin'].includes(userRole);
  
  const [selectedTable, setSelectedTable] = useState(null);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [refreshTime, setRefreshTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTime(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Sample system data with enhanced information
  const systemTables = [
    {
      name: 'users',
      displayName: 'Users',
      icon: 'bi-people-fill',
      gradient: 'from-blue-500 via-blue-600 to-indigo-700',
      count: props.tableStats?.users || 15,
      description: 'System users and authentication',
      lastUpdated: '2 minutes ago',
      route: 'users.index',
      growth: '+12%',
      status: 'healthy',
      fields: ['id', 'name', 'email', 'role', 'is_active', 'created_at']
    }, 
   {
      name: 'medicines',
      displayName: 'Medicines',
      icon: 'bi-capsule-pill',
      gradient: 'from-emerald-500 via-green-600 to-teal-700',
      count: props.tableStats?.medicines || 156,
      description: 'Medicine inventory and stock levels',
      lastUpdated: '5 minutes ago',
      route: 'medicines.index',
      growth: '+8%',
      status: 'healthy',
      fields: ['id', 'name', 'brand', 'stock', 'price', 'expiry_date']
    },
    {
      name: 'sales',
      displayName: 'Sales',
      icon: 'bi-receipt-cutoff',
      gradient: 'from-amber-500 via-orange-600 to-red-600',
      count: props.tableStats?.sales || 1247,
      description: 'Sales transactions and revenue',
      lastUpdated: '1 minute ago',
      route: 'sales.index',
      growth: '+24%',
      status: 'excellent',
      fields: ['id', 'customer', 'medicine_id', 'quantity', 'total', 'date']
    },
    {
      name: 'stock_movements',
      displayName: 'Stock Movements',
      icon: 'bi-arrow-left-right',
      gradient: 'from-purple-500 via-violet-600 to-purple-700',
      count: props.tableStats?.stock_movements || 892,
      description: 'Inventory movements and adjustments',
      lastUpdated: '3 minutes ago',
      route: 'stock-movements.index',
      growth: '+15%',
      status: 'healthy',
      fields: ['id', 'medicine_id', 'type', 'quantity', 'reference', 'date']
    },
    {
      name: 'customers',
      displayName: 'Customers',
      icon: 'bi-person-hearts',
      gradient: 'from-pink-500 via-rose-600 to-red-600',
      count: props.tableStats?.customers || 543,
      description: 'Customer profiles and history',
      lastUpdated: '10 minutes ago',
      route: 'customers.index',
      growth: '+18%',
      status: 'healthy',
      fields: ['id', 'name', 'phone', 'email', 'address', 'created_at']
    },
    {
      name: 'suppliers',
      displayName: 'Suppliers',
      icon: 'bi-building-fill-gear',
      gradient: 'from-cyan-500 via-blue-600 to-indigo-700',
      count: props.tableStats?.suppliers || 23,
      description: 'Supplier contacts and partnerships',
      lastUpdated: '15 minutes ago',
      route: 'suppliers.index',
      growth: '+5%',
      status: 'stable',
      fields: ['id', 'name', 'contact_person', 'phone', 'email', 'address']
    },
    {
      name: 'pharmacies',
      displayName: 'Pharmacies',
      icon: 'bi-shop-window',
      gradient: 'from-teal-500 via-cyan-600 to-blue-700',
      count: props.tableStats?.pharmacies || 3,
      description: 'Pharmacy branches and locations',
      lastUpdated: '1 hour ago',
      route: 'pharmacies.index',
      growth: '0%',
      status: 'stable',
      fields: ['id', 'name', 'address', 'phone', 'license_number', 'manager']
    },
    {
      name: 'audit_logs',
      displayName: 'Audit Logs',
      icon: 'bi-shield-fill-check',
      gradient: 'from-slate-500 via-gray-600 to-zinc-700',
      count: props.tableStats?.audit_logs || 5672,
      description: 'System activity and security logs',
      lastUpdated: '30 seconds ago',
      route: 'audit-logs.index',
      growth: '+45%',
      status: 'active',
      fields: ['id', 'user_id', 'action', 'table_name', 'record_id', 'created_at']
    }
  ];  
const systemStats = {
    totalRecords: systemTables.reduce((sum, table) => sum + table.count, 0),
    activeUsers: props.systemStats?.activeUsers || 8,
    dailyTransactions: props.systemStats?.dailyTransactions || 45,
    systemUptime: props.systemStats?.systemUptime || '99.9%',
    databaseSize: props.systemStats?.databaseSize || '2.3 GB',
    lastBackup: props.systemStats?.lastBackup || '2 hours ago',
    cpuUsage: props.systemStats?.cpuUsage || '23%',
    memoryUsage: props.systemStats?.memoryUsage || '67%',
    diskUsage: props.systemStats?.diskUsage || '45%'
  };

  const getStatusColor = (status) => {
    const colors = {
      excellent: 'text-emerald-500',
      healthy: 'text-green-500',
      stable: 'text-blue-500',
      active: 'text-purple-500',
      warning: 'text-yellow-500',
      critical: 'text-red-500'
    };
    return colors[status] || colors.healthy;
  };

  const getStatusIcon = (status) => {
    const icons = {
      excellent: 'bi-emoji-smile-fill',
      healthy: 'bi-check-circle-fill',
      stable: 'bi-dash-circle-fill',
      active: 'bi-lightning-charge-fill',
      warning: 'bi-exclamation-triangle-fill',
      critical: 'bi-x-circle-fill'
    };
    return icons[status] || icons.healthy;
  };

  const openTableModal = (table) => {
    setSelectedTable(table);
    setIsTableModalOpen(true);
  };

  const refreshData = () => {
    setIsLoading(true);
    setTimeout(() => {
      setRefreshTime(new Date());
      setIsLoading(false);
      // In real app: router.reload({ only: ['tableStats', 'systemStats'] });
    }, 1000);
  };  if (!canViewSystemData) {
    return (
      <AuthenticatedLayout
        header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">System Monitor</h2>}
      >
        <Head title="System Monitor" />
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-100">
          <div className="py-12">
            <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
              <div className="bg-white/80 backdrop-blur-sm border border-red-200 rounded-2xl p-8 shadow-xl">
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-r from-red-500 to-pink-600 mb-6">
                    <i className="bi bi-shield-exclamation text-white text-2xl"></i>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Access Restricted</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    You need Pharmacy Admin or Super Admin privileges to access the System Monitor.
                    Contact your administrator to request elevated permissions.
                  </p>
                  <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full">
                    <i className="bi bi-person-badge mr-2 text-gray-600"></i>
                    <span className="text-sm font-medium text-gray-700">Current role: {userRole}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout
      header={
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-xl text-gray-800 leading-tight">System Monitor</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <i className={`bi ${darkMode ? 'bi-sun-fill' : 'bi-moon-fill'} text-gray-600`}></i>
            </button>
          </div>
        </div>
      }
    >
      <Head title="System Monitor" />

      <div className={`min-h-screen transition-all duration-500 ${
        darkMode 
          ? 'bg-gradient-to-br from-gray-900 via-slate-800 to-zinc-900' 
          : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100'
      }`}>
        <div className="py-8">
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-8">{/* Content will continue... */}        
    {/* Animated Header */}
            <div className="relative overflow-hidden">
              <div className={`rounded-3xl p-8 shadow-2xl backdrop-blur-sm border transition-all duration-500 ${
                darkMode 
                  ? 'bg-gray-800/50 border-gray-700' 
                  : 'bg-white/70 border-white/50'
              }`}>
                <div className="flex justify-between items-center">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg">
                        <i className="bi bi-speedometer2 text-white text-2xl"></i>
                      </div>
                      <div>
                        <h1 className={`text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent`}>
                          System Monitor
                        </h1>
                        <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} text-lg`}>
                          Real-time database monitoring and analytics
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className={`text-right text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      <div className="flex items-center gap-2">
                        <i className="bi bi-clock text-green-500"></i>
                        <span>Last updated: {refreshTime.toLocaleTimeString()}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <i className="bi bi-person-badge text-blue-500"></i>
                        <span>Role: {userRole}</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={refreshData}
                      disabled={isLoading}
                      className="group relative px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50"
                    >
                      <div className="flex items-center gap-2">
                        <i className={`bi bi-arrow-clockwise ${isLoading ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-500`}></i>
                        <span>{isLoading ? 'Refreshing...' : 'Refresh'}</span>
                      </div>
                    </button>
                  </div>
                </div>
                
                {/* Animated background elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-pink-400/20 to-blue-600/20 rounded-full blur-2xl"></div>
              </div>
            </div>    
        {/* System Overview Stats - Enhanced */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: 'bi-database-fill',
                  label: 'Total Records',
                  value: systemStats.totalRecords.toLocaleString(),
                  gradient: 'from-blue-500 to-cyan-600',
                  change: '+12.5%',
                  trend: 'up'
                },
                {
                  icon: 'bi-people-fill',
                  label: 'Active Users',
                  value: systemStats.activeUsers,
                  gradient: 'from-green-500 to-emerald-600',
                  change: '+3',
                  trend: 'up'
                },
                {
                  icon: 'bi-graph-up-arrow',
                  label: 'Daily Transactions',
                  value: systemStats.dailyTransactions,
                  gradient: 'from-yellow-500 to-orange-600',
                  change: '+18%',
                  trend: 'up'
                },
                {
                  icon: 'bi-speedometer2',
                  label: 'System Uptime',
                  value: systemStats.systemUptime,
                  gradient: 'from-purple-500 to-pink-600',
                  change: 'Excellent',
                  trend: 'stable'
                }
              ].map((stat, index) => (
                <div
                  key={index}
                  className={`group relative overflow-hidden rounded-2xl p-6 shadow-xl backdrop-blur-sm border transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                    darkMode 
                      ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800/70' 
                      : 'bg-white/70 border-white/50 hover:bg-white/90'
                  }`}
                >
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.gradient} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <i className={`${stat.icon} text-white text-xl`}></i>
                      </div>
                      <div className={`flex items-center gap-1 text-sm font-medium ${
                        stat.trend === 'up' ? 'text-green-500' : 'text-blue-500'
                      }`}>
                        <i className={`bi ${stat.trend === 'up' ? 'bi-arrow-up' : 'bi-dash'}`}></i>
                        <span>{stat.change}</span>
                      </div>
                    </div>
                    <div className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}>
                      {stat.label}
                    </div>
                    <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {stat.value}
                    </div>
                  </div>
                  
                  {/* Animated background gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${stat.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
                  
                  {/* Floating particles effect */}
                  <div className="absolute top-2 right-2 w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
                  <div className="absolute bottom-4 left-4 w-1 h-1 bg-white/20 rounded-full animate-ping"></div>
                </div>
              ))}
            </div>   
         {/* Performance Metrics */}
            <div className={`rounded-2xl p-6 shadow-xl backdrop-blur-sm border transition-all duration-500 ${
              darkMode 
                ? 'bg-gray-800/50 border-gray-700' 
                : 'bg-white/70 border-white/50'
            }`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600">
                  <i className="bi bi-cpu text-white text-lg"></i>
                </div>
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  System Performance
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'CPU Usage', value: systemStats.cpuUsage, color: 'blue', max: 100 },
                  { label: 'Memory Usage', value: systemStats.memoryUsage, color: 'green', max: 100 },
                  { label: 'Disk Usage', value: systemStats.diskUsage, color: 'purple', max: 100 }
                ].map((metric, index) => {
                  const percentage = parseInt(metric.value);
                  const getColor = (color) => {
                    const colors = {
                      blue: 'from-blue-500 to-cyan-600',
                      green: 'from-green-500 to-emerald-600',
                      purple: 'from-purple-500 to-pink-600'
                    };
                    return colors[color];
                  };
                  
                  return (
                    <div key={index} className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          {metric.label}
                        </span>
                        <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {metric.value}
                        </span>
                      </div>
                      <div className={`w-full h-3 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} overflow-hidden`}>
                        <div
                          className={`h-full bg-gradient-to-r ${getColor(metric.color)} rounded-full transition-all duration-1000 ease-out shadow-lg`}
                          style={{ width: `${percentage}%` }}
                        >
                          <div className="h-full w-full bg-white/20 animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>      
      {/* Database Tables Grid - Enhanced */}
            <div className={`rounded-2xl p-6 shadow-xl backdrop-blur-sm border transition-all duration-500 ${
              darkMode 
                ? 'bg-gray-800/50 border-gray-700' 
                : 'bg-white/70 border-white/50'
            }`}>
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600">
                    <i className="bi bi-table text-white text-lg"></i>
                  </div>
                  <div>
                    <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Database Tables
                    </h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Click any table to explore and manage data
                    </p>
                  </div>
                </div>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} flex items-center gap-2`}>
                  <i className="bi bi-info-circle"></i>
                  <span>Live data • Auto-refresh enabled</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {systemTables.map((table, index) => (
                  <div
                    key={table.name}
                    onClick={() => openTableModal(table)}
                    className={`group relative overflow-hidden rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl transform ${
                      darkMode 
                        ? 'bg-gray-700/50 hover:bg-gray-700/70 border border-gray-600' 
                        : 'bg-white/80 hover:bg-white border border-gray-200'
                    }`}
                    style={{
                      animationDelay: `${index * 100}ms`
                    }}
                  >
                    {/* Background Gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${table.gradient} opacity-10 group-hover:opacity-20 transition-opacity duration-300`}></div>
                    
                    <div className="relative z-10">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-xl bg-gradient-to-r ${table.gradient} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                          <i className={`${table.icon} text-white text-xl`}></i>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`flex items-center gap-1 text-xs font-medium ${
                            table.growth.startsWith('+') ? 'text-green-500' : 'text-blue-500'
                          }`}>
                            <i className={`bi ${table.growth.startsWith('+') ? 'bi-arrow-up' : 'bi-dash'}`}></i>
                            <span>{table.growth}</span>
                          </div>
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(table.status)} animate-pulse`}></div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="space-y-3">
                        <div>
                          <h4 className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-gray-900'} group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:${table.gradient} group-hover:bg-clip-text transition-all duration-300`}>
                            {table.displayName}
                          </h4>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} line-clamp-2`}>
                            {table.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {table.count.toLocaleString()}
                            </div>
                            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} flex items-center gap-1`}>
                              <i className="bi bi-clock"></i>
                              <span>{table.lastUpdated}</span>
                            </div>
                          </div>
                          <div className={`flex items-center gap-1 ${getStatusColor(table.status)}`}>
                            <i className={`${getStatusIcon(table.status)} text-sm`}></i>
                            <span className="text-xs font-medium capitalize">{table.status}</span>
                          </div>
                        </div>
                      </div>

                      {/* Hover Effect Arrow */}
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <i className="bi bi-arrow-up-right text-gray-400 group-hover:text-white"></i>
                      </div>
                    </div>

                    {/* Animated particles */}
                    <div className="absolute top-2 right-8 w-1 h-1 bg-white/30 rounded-full animate-ping"></div>
                    <div className="absolute bottom-8 left-2 w-2 h-2 bg-white/20 rounded-full animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>         
   {/* Quick Actions - Enhanced */}
            <div className={`rounded-2xl p-6 shadow-xl backdrop-blur-sm border transition-all duration-500 ${
              darkMode 
                ? 'bg-gray-800/50 border-gray-700' 
                : 'bg-white/70 border-white/50'
            }`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-gradient-to-r from-pink-500 to-rose-600">
                  <i className="bi bi-lightning-charge text-white text-lg"></i>
                </div>
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Quick Actions
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    title: 'Manage Users',
                    description: 'User accounts & roles',
                    icon: 'bi-people-fill',
                    gradient: 'from-blue-500 to-indigo-600',
                    route: 'users.index'
                  },
                  {
                    title: 'Manage Medicines',
                    description: 'Inventory & stock',
                    icon: 'bi-capsule-pill',
                    gradient: 'from-green-500 to-emerald-600',
                    route: 'medicines.index'
                  },
                  {
                    title: 'View Sales',
                    description: 'Transactions & reports',
                    icon: 'bi-receipt-cutoff',
                    gradient: 'from-yellow-500 to-orange-600',
                    route: 'sales.index'
                  },
                  {
                    title: 'Backup Database',
                    description: 'Export system data',
                    icon: 'bi-cloud-download',
                    gradient: 'from-purple-500 to-pink-600',
                    action: () => alert('Database backup initiated!')
                  }
                ].map((action, index) => (
                  <div
                    key={index}
                    className={`group relative overflow-hidden rounded-xl p-4 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                      darkMode 
                        ? 'bg-gray-700/50 hover:bg-gray-700/70 border border-gray-600' 
                        : 'bg-white/80 hover:bg-white border border-gray-200'
                    }`}
                    onClick={action.action || (() => {})}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-r ${action.gradient} opacity-5 group-hover:opacity-15 transition-opacity duration-300`}></div>
                    
                    <div className="relative z-10 flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-r ${action.gradient} shadow-md group-hover:scale-110 transition-transform duration-300`}>
                        <i className={`${action.icon} text-white text-lg`}></i>
                      </div>
                      <div className="flex-1">
                        <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'} group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:${action.gradient} group-hover:bg-clip-text transition-all duration-300`}>
                          {action.title}
                        </div>
                        <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {action.description}
                        </div>
                      </div>
                      <i className="bi bi-arrow-right text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-300"></i>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Table Details Modal */}
        <Modal show={isTableModalOpen} onClose={() => setIsTableModalOpen(false)}>
          <div className={`p-6 max-w-2xl ${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} rounded-2xl`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${selectedTable?.gradient} flex items-center justify-center shadow-lg`}>
                  <i className={`${selectedTable?.icon} text-white text-xl`}></i>
                </div>
                <div>
                  <h3 className="text-xl font-bold">
                    {selectedTable?.displayName} Table
                  </h3>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {selectedTable?.description}
                  </p>
                </div>
              </div>
              <button
                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
                onClick={() => setIsTableModalOpen(false)}
              >
                <i className="bi bi-x-lg text-gray-400 hover:text-gray-600"></i>
              </button>
            </div>

            {selectedTable && (
              <div className="space-y-6">
                {/* Enhanced Table Statistics */}
                <div className="grid grid-cols-3 gap-4">
                  <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Total Records</div>
                    <div className="text-2xl font-bold">{selectedTable.count.toLocaleString()}</div>
                  </div>
                  <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Growth</div>
                    <div className={`text-lg font-bold ${selectedTable.growth.startsWith('+') ? 'text-green-500' : 'text-blue-500'}`}>
                      {selectedTable.growth}
                    </div>
                  </div>
                  <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Status</div>
                    <div className={`text-lg font-bold capitalize ${getStatusColor(selectedTable.status)}`}>
                      {selectedTable.status}
                    </div>
                  </div>
                </div>

                {/* Table Fields */}
                <div>
                  <h4 className="text-sm font-semibold mb-3">Table Structure</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedTable.fields.map((field) => (
                      <div key={field} className={`px-3 py-2 rounded-lg text-sm font-mono ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                        {field}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Enhanced Actions */}
                <div>
                  <h4 className="text-sm font-semibold mb-3">Available Actions</h4>
                  <div className="flex gap-3">
                    <button className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r ${selectedTable.gradient} text-white rounded-xl font-medium hover:shadow-lg transition-all duration-200`}>
                      <i className="bi bi-eye"></i>
                      <span>View & Manage</span>
                    </button>
                    <button 
                      onClick={() => alert(`Exporting ${selectedTable.displayName} data...`)}
                      className={`px-4 py-3 border rounded-xl font-medium transition-colors ${
                        darkMode 
                          ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <i className="bi bi-download mr-2"></i>
                      Export
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Modal>
      </div>
    </AuthenticatedLayout>
  );
}
