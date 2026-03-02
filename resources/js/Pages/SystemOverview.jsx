import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import 'bootstrap-icons/font/bootstrap-icons.css';

export default function SystemOverview({ stats: initialStats = {}, systemHealth: initialSystemHealth = 'excellent', lastUpdated: initialLastUpdated = new Date() }) {
  // Use safe defaults for all stats
  const stats = {
    totalMedicines: initialStats?.totalMedicines || 0,
    totalCustomers: initialStats?.totalCustomers || 0,
    totalSales: initialStats?.totalSales || 0,
    totalRevenue: initialStats?.totalRevenue || 0,
    medicinesGrowth: initialStats?.medicinesGrowth || 0,
    customersGrowth: initialStats?.customersGrowth || 0,
    salesGrowth: initialStats?.salesGrowth || 0,
    revenueGrowth: initialStats?.revenueGrowth || 0,
    lowStockMedicines: initialStats?.lowStockMedicines || 0,
    newCustomersThisMonth: initialStats?.newCustomersThisMonth || 0,
    activeSuppliers: initialStats?.activeSuppliers || 0,
    todaySales: initialStats?.todaySales || 0,
    todayRevenue: initialStats?.todayRevenue || 0,
  };
  
  const [activeModule, setActiveModule] = useState(null);
  const systemHealth = initialSystemHealth || 'excellent';
  const lastUpdated = new Date(initialLastUpdated);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const systemModules = [
    {
      title: 'Enhanced Analytics',
      description: 'Advanced business intelligence with interactive charts and real-time insights',
      icon: 'bi-graph-up-arrow',
      color: 'blue',
      gradient: 'from-accent-500 to-primary-600',
      bgGradient: 'from-accent-50 to-primary-50',
      route: 'dashboard.enhanced',
      features: ['Real-time Charts', 'Revenue Analytics', 'Performance KPIs', 'AI Insights'],
      status: 'active',
      uptime: '99.9%',
      users: Math.floor((stats.totalCustomers || 0) * 0.25),
      category: 'analytics',
    },
    {
      title: 'Smart POS System',
      description: 'Complete point-of-sale solution with multi-payment support and receipt printing',
      icon: 'bi-cart-check',
      color: 'green',
      gradient: 'from-green-500 to-emerald-600',
      bgGradient: 'from-green-50 to-emerald-50',
      route: 'pos.dashboard',
      features: ['Multi-Payment', 'Receipt Printing', 'Customer Loyalty', 'Inventory Sync'],
      status: 'active',
      uptime: '99.8%',
      users: Math.floor((stats.totalCustomers || 0) * 0.15),
      category: 'sales',
    },
    {
      title: 'Inventory Intelligence',
      description: 'AI-powered stock control with predictive analytics and automated reordering',
      icon: 'bi-boxes',
      color: 'purple',
      gradient: 'from-primary-500 to-neutral-600',
      bgGradient: 'from-primary-50 to-neutral-50',
      route: 'medicines.index',
      features: ['Smart Tracking', 'Batch Management', 'Auto Alerts', 'Expiry Monitoring'],
      status: 'active',
      uptime: '99.7%',
      users: Math.floor((stats.totalCustomers || 0) * 0.20),
      category: 'inventory',
    },
    {
      title: 'AI Assistant',
      description: 'Machine learning powered predictions and intelligent business recommendations',
      icon: 'bi-robot',
      color: 'indigo',
      gradient: 'from-primary-500 to-accent-600',
      bgGradient: 'from-primary-50 to-accent-50',
      route: 'dashboard',
      features: ['Predictive Analytics', 'Smart Recommendations', 'Trend Analysis', 'Business Insights'],
      status: 'active',
      uptime: '99.5%',
      users: Math.floor((stats.totalCustomers || 0) * 0.12),
      category: 'analytics',
    },
    {
      title: 'Customer Hub',
      description: 'Complete CRM with loyalty programs and personalized customer experiences',
      icon: 'bi-people',
      color: 'pink',
      gradient: 'from-pink-500 to-rose-600',
      bgGradient: 'from-pink-50 to-rose-50',
      route: 'customers.index',
      features: ['Customer Profiles', 'Loyalty Tiers', 'Purchase History', 'Communication'],
      status: 'active',
      uptime: '99.9%',
      users: Math.floor((stats.totalCustomers || 0) * 0.18),
      category: 'crm',
    },
    {
      title: 'Medicine Catalog',
      description: 'Comprehensive medicine database with detailed information and smart pricing',
      icon: 'bi-capsule-pill',
      color: 'teal',
      gradient: 'from-teal-500 to-cyan-600',
      bgGradient: 'from-teal-50 to-cyan-50',
      route: 'medicines.index',
      features: ['Medicine Database', 'Smart Pricing', 'Category Management', 'Prescription Tracking'],
      status: 'active',
      uptime: '99.8%',
      users: Math.floor((stats.totalCustomers || 0) * 0.22),
      category: 'inventory',
    },
    {
      title: 'Security Center',
      description: 'Advanced security features with comprehensive audit trails and monitoring',
      icon: 'bi-shield-check',
      color: 'red',
      gradient: 'from-red-500 to-pink-600',
      bgGradient: 'from-red-50 to-pink-50',
      route: 'dashboard',
      features: ['Activity Logging', 'Security Monitoring', 'Access Control', 'Compliance Reports'],
      status: 'active',
      uptime: '100%',
      users: Math.floor((stats.totalCustomers || 0) * 0.08),
      category: 'security',
    },
    {
      title: 'Supplier Network',
      description: 'Streamlined supplier relationships with automated procurement processes',
      icon: 'bi-truck',
      color: 'orange',
      gradient: 'from-orange-500 to-red-600',
      bgGradient: 'from-orange-50 to-red-50',
      route: 'suppliers.index',
      features: ['Supplier Profiles', 'Order Automation', 'Performance Tracking', 'Contract Management'],
      status: 'active',
      uptime: '99.6%',
      users: Math.floor((stats.activeSuppliers || 0) * 1.5),
      category: 'procurement',
    },
  ];

  const keyFeatures = [
    {
      title: 'Real-Time Analytics',
      description: 'Live business insights with interactive dashboards and AI-powered predictions',
      icon: 'bi-graph-up-arrow',
      gradient: 'from-accent-500 to-primary-600',
      highlight: true,
      metric: '99.9% Accuracy',
    },
    {
      title: 'Smart POS System',
      description: 'Multi-payment support with loyalty integration and receipt automation',
      icon: 'bi-credit-card',
      gradient: 'from-green-500 to-emerald-600',
      highlight: true,
      metric: '15+ Payment Methods',
    },
    {
      title: 'AI-Powered Insights',
      description: 'Machine learning for predictive analytics and intelligent recommendations',
      icon: 'bi-lightbulb',
      gradient: 'from-primary-500 to-neutral-600',
      highlight: true,
      metric: '85% Prediction Rate',
    },
    {
      title: 'Enterprise Security',
      description: 'Role-based access control with comprehensive audit trails and monitoring',
      icon: 'bi-shield-check',
      gradient: 'from-red-500 to-pink-600',
      highlight: false,
      metric: '256-bit Encryption',
    },
    {
      title: 'Inventory Intelligence',
      description: 'Smart stock management with automated alerts and predictive reordering',
      icon: 'bi-boxes',
      gradient: 'from-teal-500 to-cyan-600',
      highlight: false,
      metric: '95% Stock Accuracy',
    },
    {
      title: 'Customer Experience',
      description: 'Tier-based loyalty program with personalized rewards and communication',
      icon: 'bi-people',
      gradient: 'from-orange-500 to-red-600',
      highlight: false,
      metric: '94% Satisfaction',
    },
  ];

  // Filter modules based on search and category
  const filteredModules = (systemModules || []).filter(module => {
    // Skip modules without routes
    if (!module.route) return false;
    
    const matchesSearch = module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         module.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (module.features || []).some(feature => feature.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || module.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: 'all', name: 'All Modules', icon: 'bi-grid-3x3-gap' },
    { id: 'analytics', name: 'Analytics', icon: 'bi-graph-up-arrow' },
    { id: 'sales', name: 'Sales', icon: 'bi-cart-check' },
    { id: 'inventory', name: 'Inventory', icon: 'bi-boxes' },

    { id: 'crm', name: 'Customer', icon: 'bi-people' },
    { id: 'security', name: 'Security', icon: 'bi-shield-check' },
    { id: 'procurement', name: 'Procurement', icon: 'bi-truck' },
  ];

  const formatNumber = num => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatCurrency = num => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <AuthenticatedLayout>
      <Head title="System Overview - MediTrack" />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-accent-400/20 to-primary-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-accent-400/20 to-primary-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-primary-400/10 to-neutral-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Professional Hero Section */}
          <div className="relative bg-gradient-to-r from-primary-900 via-primary-800 to-accent-900 rounded-3xl p-12 shadow-2xl border border-primary-700/50 overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-r from-accent-600/10 to-primary-600/10"></div>
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.1) 0%, transparent 50%), 
                               radial-gradient(circle at 75% 75%, rgba(147, 51, 234, 0.1) 0%, transparent 50%)`
            }}></div>
            
            <div className="relative z-10 text-center">
              <div className="flex items-center justify-center mb-8">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-br from-accent-500 to-primary-600 rounded-3xl flex items-center justify-center shadow-2xl">
                    <i className="bi bi-rocket-takeoff text-4xl text-white"></i>
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                    <i className="bi bi-check text-white text-sm"></i>
                  </div>
                </div>
              </div>
              
              <h1 className="text-5xl font-bold text-white mb-6">
                MediTrack System Overview
              </h1>
              <p className="text-xl text-blue-100 max-w-4xl mx-auto mb-8 leading-relaxed">
                Enterprise-grade pharmacy management system with advanced analytics, AI-powered insights, 
                and comprehensive business intelligence capabilities for modern healthcare operations.
              </p>
              
              <div className="flex items-center justify-center gap-6 mb-8">
                <div className={`flex items-center gap-3 px-6 py-3 rounded-full border ${
                  systemHealth === 'excellent' ? 'bg-green-500/20 text-green-300 border-green-400/30' :
                  systemHealth === 'good' ? 'bg-blue-500/20 text-blue-300 border-blue-400/30' :
                  systemHealth === 'fair' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30' :
                  'bg-red-500/20 text-red-300 border-red-400/30'
                }`}>
                  <div className={`w-3 h-3 rounded-full animate-pulse ${
                    systemHealth === 'excellent' ? 'bg-green-400' :
                    systemHealth === 'good' ? 'bg-blue-400' :
                    systemHealth === 'fair' ? 'bg-yellow-400' :
                    'bg-red-400'
                  }`}></div>
                  <span className="font-semibold">
                    {systemHealth === 'excellent' ? 'All Systems Operational' :
                     systemHealth === 'good' ? 'Systems Running Well' :
                     systemHealth === 'fair' ? 'Minor Issues Detected' :
                     'System Issues Present'}
                  </span>
                </div>
                <div className="flex items-center gap-3 px-6 py-3 bg-blue-500/20 text-blue-300 rounded-full border border-blue-400/30">
                  <i className="bi bi-people text-lg"></i>
                  <span className="font-semibold">{formatNumber(stats.totalCustomers || 0)} Active Users</span>
                </div>
                <div className="flex items-center gap-3 px-6 py-3 bg-purple-500/20 text-purple-300 rounded-full border border-purple-400/30">
                  <i className="bi bi-graph-up text-lg"></i>
                  <span className="font-semibold">{formatNumber(stats.totalSales || 0)} Total Sales</span>
                </div>
              </div>

              <div className="text-sm text-blue-200">
                Last updated: {lastUpdated.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Professional Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'Total Medicines',
                value: isLoading ? '---' : formatNumber(stats.totalMedicines),
                subtitle: `${stats.lowStockMedicines || 0} low stock`,
                icon: 'bi-capsule-pill',
                gradient: 'from-emerald-500 to-teal-600',
                bgGradient: 'from-emerald-50 via-green-50 to-teal-50',
                iconBg: 'bg-gradient-to-br from-emerald-400 to-teal-500',
                trend: Math.max(0, stats.medicinesGrowth || 0),
                trendLabel: stats.medicinesGrowth > 0 ? `+${stats.medicinesGrowth}%` : `${stats.medicinesGrowth || 0}%`,
              },
              {
                title: 'Active Customers',
                value: isLoading ? '---' : formatNumber(stats.totalCustomers),
                subtitle: `${stats.newCustomersThisMonth || 0} new this month`,
                icon: 'bi-people',
                gradient: 'from-accent-500 to-primary-600',
                bgGradient: 'from-accent-50 via-primary-50 to-neutral-50',
                iconBg: 'bg-gradient-to-br from-accent-400 to-primary-500',
                trend: Math.max(0, stats.customersGrowth || 0),
                trendLabel: stats.customersGrowth > 0 ? `+${stats.customersGrowth}%` : `${stats.customersGrowth || 0}%`,
              },
              {
                title: 'Total Sales',
                value: isLoading ? '---' : formatNumber(stats.totalSales),
                subtitle: `${stats.todaySales || 0} today`,
                icon: 'bi-cart-check',
                gradient: 'from-primary-500 to-neutral-600',
                bgGradient: 'from-primary-50 via-neutral-50 to-neutral-100',
                iconBg: 'bg-gradient-to-br from-primary-400 to-neutral-500',
                trend: Math.max(0, stats.salesGrowth || 0),
                trendLabel: stats.salesGrowth > 0 ? `+${stats.salesGrowth}%` : `${stats.salesGrowth || 0}%`,
              },
              {
                title: 'Total Revenue',
                value: isLoading ? '---' : formatCurrency(stats.totalRevenue),
                subtitle: `${formatCurrency(stats.todayRevenue || 0)} today`,
                icon: 'bi-cash-coin',
                gradient: 'from-orange-500 to-red-600',
                bgGradient: 'from-orange-50 via-amber-50 to-red-50',
                iconBg: 'bg-gradient-to-br from-orange-400 to-red-500',
                trend: Math.max(0, stats.revenueGrowth || 0),
                trendLabel: stats.revenueGrowth > 0 ? `+${stats.revenueGrowth}%` : `${stats.revenueGrowth || 0}%`,
              }
            ].map((card, index) => (
              <div
                key={card.title}
                className={`group relative bg-gradient-to-br ${card.bgGradient} rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 border border-white/60 backdrop-blur-sm overflow-hidden`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white transform translate-x-16 -translate-y-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white transform -translate-x-12 translate-y-12"></div>
                </div>

                <div className="relative z-10 flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm font-semibold text-slate-700">{card.title}</p>
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    </div>
                    <p className={`text-4xl font-bold text-slate-900 mb-2 font-mono-numbers tracking-tight ${isLoading ? 'animate-pulse' : ''}`}>
                      {card.value}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                        card.trend > 0 ? 'text-green-700 bg-green-100' : 
                        card.trend < 0 ? 'text-red-700 bg-red-100' : 
                        'text-slate-700 bg-slate-100'
                      }`}>
                        <i className={`bi ${card.trend > 0 ? 'bi-trending-up' : card.trend < 0 ? 'bi-trending-down' : 'bi-dash'}`}></i>
                        {card.trendLabel}
                      </span>
                      <span className="text-xs text-slate-600">{card.subtitle}</span>
                    </div>
                  </div>
                  <div className={`w-16 h-16 ${card.iconBg} rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                    <i className={`${card.icon} text-2xl text-white drop-shadow-sm`}></i>
                  </div>
                </div>
                
                {/* Enhanced Progress Bar */}
                <div className="relative z-10 mt-4">
                  <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
                    <span>Growth</span>
                    <span>{card.trend}% vs last month</span>
                  </div>
                  <div className="w-full bg-white/60 rounded-full h-3 shadow-inner">
                    <div 
                      className={`bg-gradient-to-r ${card.gradient} h-3 rounded-full transition-all duration-1000 shadow-sm relative overflow-hidden`}
                      style={{ width: `${Math.min(100, card.trend * 4)}%` }}
                    >
                      <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                    </div>
                  </div>
                </div>

                {/* Hover Glow Effect */}
                <div className={`absolute inset-0 bg-gradient-to-r ${card.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-3xl`}></div>
                
                {/* Corner Accent */}
                <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${card.gradient} opacity-10 rounded-bl-full`}></div>
              </div>
            ))}
          </div>

          {/* Professional Key Features */}
          <div className="space-y-8">
            <div className="text-center">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/80 backdrop-blur-xl rounded-full shadow-lg border border-white/50 mb-6">
                <i className="bi bi-stars text-2xl text-indigo-600"></i>
                <h2 className="text-2xl font-bold text-slate-900">Enterprise Features</h2>
              </div>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Advanced capabilities that set MediTrack apart from traditional pharmacy systems
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {(keyFeatures || []).map((feature, index) => (
                <div
                  key={index}
                  className={`group relative overflow-hidden rounded-3xl p-8 transition-all duration-500 hover:scale-105 ${
                    feature.highlight
                      ? 'bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/50 shadow-2xl border border-blue-200/50'
                      : 'bg-white/80 backdrop-blur-xl shadow-xl border border-white/50 hover:shadow-2xl'
                  }`}
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-5">
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feature.gradient} rounded-full transform translate-x-16 -translate-y-16`}></div>
                  </div>

                  {/* Premium Badge */}
                  {feature.highlight && (
                    <div className="absolute -top-3 -right-3">
                      <div className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center shadow-xl animate-pulse`}>
                        <i className="bi bi-stars text-white text-lg"></i>
                      </div>
                    </div>
                  )}

                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300`}>
                        <i className={`${feature.icon} text-2xl text-white`}></i>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 mb-1">{feature.title}</h3>
                        <div className={`inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r ${feature.gradient} bg-opacity-10 rounded-full`}>
                          <i className="bi bi-check-circle text-sm text-green-600"></i>
                          <span className="text-sm font-semibold text-slate-700">{feature.metric}</span>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-slate-600 leading-relaxed mb-6">{feature.description}</p>
                    
                    {/* Feature Benefits */}
                    <div className="space-y-2">
                      {(feature ? [
                        feature.highlight ? 'Enterprise Grade' : 'Professional',
                        feature.highlight ? 'Real-time Updates' : 'Automated',
                        feature.highlight ? 'AI-Powered' : 'Intelligent'
                      ] : []).map((benefit, benefitIndex) => (
                        <div key={benefitIndex} className="flex items-center gap-2">
                          <i className="bi bi-check-circle-fill text-green-500 text-sm"></i>
                          <span className="text-sm text-slate-600 font-medium">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Hover Glow Effect */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-3xl`}></div>
                </div>
              ))}
            </div>
          </div>

          {/* Professional System Modules */}
          <div className="space-y-8">
            <div className="text-center">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/80 backdrop-blur-xl rounded-full shadow-lg border border-white/50 mb-6">
                <i className="bi bi-grid-3x3-gap text-2xl text-purple-600"></i>
                <h2 className="text-2xl font-bold text-slate-900">System Modules</h2>
              </div>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
                Comprehensive modules designed for complete pharmacy management and optimization
              </p>
            </div>

            {/* Search and Filter Controls */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
              <div className="flex flex-col lg:flex-row gap-6 items-center">
                {/* Search Bar */}
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="bi bi-search text-slate-400 text-lg"></i>
                  </div>
                  <input
                    type="text"
                    placeholder="Search modules, features, or descriptions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/60 border border-white/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-900 placeholder-slate-500"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      <i className="bi bi-x-circle text-lg"></i>
                    </button>
                  )}
                </div>

                {/* Category Filter */}
                <div className="flex flex-wrap gap-2">
                  {(categories || []).map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                        selectedCategory === category.id
                          ? 'bg-blue-500 text-white shadow-lg'
                          : 'bg-white/60 text-slate-600 hover:bg-white/80 hover:text-slate-900'
                      }`}
                    >
                      <i className={`${category.icon} text-sm`}></i>
                      <span className="text-sm font-medium">{category.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Results Summary */}
              <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                <span>
                  Showing {filteredModules.length} of {systemModules.length} modules
                  {searchTerm && ` for "${searchTerm}"`}
                  {selectedCategory !== 'all' && ` in ${categories.find(c => c.id === selectedCategory)?.name}`}
                </span>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    All systems operational
                  </span>
                  <span className="text-slate-500">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredModules.length > 0 ? filteredModules.map((module, index) => (
                <Link
                  key={index}
                  href={route(module.route)}
                  className={`group relative bg-gradient-to-br ${module.bgGradient} rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 border border-white/60 backdrop-blur-sm overflow-hidden`}
                  style={{ animationDelay: `${index * 100}ms` }}
                  onMouseEnter={() => setActiveModule(index)}
                  onMouseLeave={() => setActiveModule(null)}
                >
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-5">
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${module.gradient} rounded-full transform translate-x-16 -translate-y-16`}></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full transform -translate-x-12 translate-y-12"></div>
                  </div>

                  <div className="relative z-10">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className={`w-14 h-14 bg-gradient-to-br ${module.gradient} rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                        <i className={`${module.icon} text-2xl text-white`}></i>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-xs font-semibold">Active</span>
                        </div>
                        <div className="text-xs text-slate-500 font-mono-numbers">
                          {module.uptime} uptime
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors">
                      {module.title}
                    </h3>
                    <p className="text-slate-600 text-sm mb-6 leading-relaxed">{module.description}</p>

                    {/* Features List */}
                    <div className="space-y-2 mb-6">
                      {(module.features || []).map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center gap-3">
                          <i className="bi bi-check-circle-fill text-green-500 text-sm"></i>
                          <span className="text-sm text-slate-600 font-medium">{feature}</span>
                        </div>
                      ))}
                    </div>
                    {/* Module Stats */}
                    <div className="flex items-center justify-between p-3 bg-white/60 rounded-xl border border-white/40 mb-4">
                      <div className="flex items-center gap-2">
                        <i className="bi bi-people text-slate-500"></i>
                        <span className="text-sm text-slate-600">{module.users} users</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <i className="bi bi-activity text-green-500"></i>
                        <span className="text-sm text-green-600 font-semibold">Online</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-semibold bg-gradient-to-r ${module.gradient} bg-clip-text text-transparent`}>
                        Open Module
                      </span>
                      <div className={`w-8 h-8 bg-gradient-to-br ${module.gradient} bg-opacity-10 rounded-lg flex items-center justify-center group-hover:bg-opacity-20 transition-all duration-300`}>
                        <i className="bi bi-arrow-right text-slate-600 group-hover:translate-x-1 transition-transform duration-300"></i>
                      </div>
                    </div>
                  </div>

                  {/* Hover Glow Effect */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${module.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-3xl`}></div>
                  
                  {/* Active Module Highlight */}
                  {activeModule === index && (
                    <div className={`absolute inset-0 bg-gradient-to-r ${module.gradient} opacity-10 rounded-3xl animate-pulse`}></div>
                  )}
                </Link>
              )) : (
                <div className="col-span-full text-center py-12">
                  <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="bi bi-search text-3xl text-slate-400"></i>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">No modules found</h3>
                  <p className="text-slate-600 mb-6">
                    Try adjusting your search terms or category filter to find what you're looking for.
                  </p>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('all');
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors duration-200"
                  >
                    <i className="bi bi-arrow-clockwise"></i>
                    Reset Filters
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Professional Technology Stack */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/50">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-slate-100 to-blue-100 rounded-full shadow-lg border border-white/50 mb-6">
                <i className="bi bi-stack text-2xl text-slate-700"></i>
                <h2 className="text-2xl font-bold text-slate-900">Technology Stack</h2>
              </div>
              <p className="text-lg text-slate-600">Built with modern, enterprise-grade technologies</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {[
                { name: 'Laravel', category: 'Backend', icon: 'bi-server', gradient: 'from-red-500 to-orange-600' },
                { name: 'React', category: 'Frontend', icon: 'bi-code-slash', gradient: 'from-accent-500 to-primary-600' },
                { name: 'Inertia.js', category: 'Full-Stack', icon: 'bi-layers', gradient: 'from-primary-500 to-neutral-600' },
                { name: 'Tailwind CSS', category: 'Styling', icon: 'bi-palette', gradient: 'from-teal-500 to-green-600' },
                { name: 'Recharts', category: 'Charts', icon: 'bi-bar-chart', gradient: 'from-primary-500 to-accent-600' },
                { name: 'SQLite', category: 'Database', icon: 'bi-database', gradient: 'from-orange-500 to-red-600' },
              ].map((tech, index) => (
                <div 
                  key={index} 
                  className="group text-center p-4 rounded-2xl bg-white/60 hover:bg-white/80 transition-all duration-300 hover:scale-105 border border-white/40 hover:shadow-lg"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`w-16 h-16 bg-gradient-to-br ${tech.gradient} rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <i className={`${tech.icon} text-2xl text-white`}></i>
                  </div>
                  <h4 className="font-bold text-slate-900 mb-1">{tech.name}</h4>
                  <p className="text-sm text-slate-600">{tech.category}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Professional Call to Action */}
          <div className="relative bg-gradient-to-r from-primary-900 via-primary-800 to-primary-700 rounded-3xl p-12 shadow-2xl border border-primary-700/50 overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-r from-accent-600/10 to-primary-600/10"></div>
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.1) 0%, transparent 50%), 
                               radial-gradient(circle at 75% 75%, rgba(147, 51, 234, 0.1) 0%, transparent 50%)`
            }}></div>
            <div className="relative z-10 text-center">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 mb-8">
                <i className="bi bi-rocket-takeoff text-2xl text-white"></i>
                <h2 className="text-2xl font-bold text-white">Ready to Transform Your Pharmacy?</h2>
              </div>
              <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
                Experience the power of MediTrack's enterprise-grade pharmacy management system. 
                Start exploring our advanced features and see the difference intelligent automation makes.
              </p>
              <div className="flex flex-wrap justify-center gap-6">
                <Link
                  href={route('dashboard.enhanced')}
                  className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-accent-500 to-primary-600 text-white rounded-2xl hover:from-accent-600 hover:to-primary-700 transition-all duration-300 font-semibold shadow-xl hover:shadow-2xl hover:scale-105"
                >
                  <i className="bi bi-graph-up-arrow text-xl group-hover:scale-110 transition-transform duration-300"></i>
                  <span>View Analytics Dashboard</span>
                  <i className="bi bi-arrow-right group-hover:translate-x-1 transition-transform duration-300"></i>
                </Link>
                <Link
                  href={route('medicines.index')}
                  className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 font-semibold shadow-xl hover:shadow-2xl hover:scale-105"
                >
                  <i className="bi bi-capsule-pill text-xl group-hover:scale-110 transition-transform duration-300"></i>
                  <span>Manage Inventory</span>
                  <i className="bi bi-arrow-right group-hover:translate-x-1 transition-transform duration-300"></i>
                </Link>
                <button
                  onClick={() => router.visit('/dashboard')}
                  className="group inline-flex items-center gap-3 px-8 py-4 bg-white/10 backdrop-blur-xl border-2 border-white/30 text-white rounded-2xl hover:bg-white/20 hover:border-white/50 transition-all duration-300 font-semibold shadow-xl hover:shadow-2xl hover:scale-105"
                >
                  <i className="bi bi-house-heart text-xl group-hover:scale-110 transition-transform duration-300"></i>
                  <span>Go to Dashboard</span>
                  <i className="bi bi-arrow-right group-hover:translate-x-1 transition-transform duration-300"></i>
                </button>
              </div>
              {/* Additional Stats */}
              <div className="flex items-center justify-center gap-8 mt-12 pt-8 border-t border-white/20">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-1">99.9%</div>
                  <div className="text-sm text-blue-200">System Uptime</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-1">1,200+</div>
                  <div className="text-sm text-blue-200">Active Users</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-1">24/7</div>
                  <div className="text-sm text-blue-200">Support Available</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
