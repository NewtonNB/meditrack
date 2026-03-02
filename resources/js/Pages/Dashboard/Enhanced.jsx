import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import 'bootstrap-icons/font/bootstrap-icons.css';

export default function EnhancedDashboard({ analytics, automation, performance, trends }) {
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [activeTab, setActiveTab] = useState('overview');
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);

  // Professional color schemes for charts
  const colors = {
    primary: '#2563EB',      // Professional blue
    secondary: '#059669',    // Success green
    accent: '#DC2626',       // Alert red
    warning: '#D97706',      // Warning orange
    info: '#0891B2',         // Info cyan
    purple: '#7C3AED',       // Royal purple
    pink: '#DB2777',         // Vibrant pink
    indigo: '#4F46E5',       // Deep indigo
    teal: '#0D9488',         // Professional teal
    emerald: '#10B981',      // Emerald green
    slate: '#475569',        // Professional gray
    rose: '#E11D48',         // Rose red
  };

  const chartGradients = {
    blue: ['#3B82F6', '#1D4ED8'],
    green: ['#10B981', '#059669'],
    purple: ['#8B5CF6', '#7C3AED'],
    orange: ['#F59E0B', '#D97706'],
    red: ['#EF4444', '#DC2626'],
    cyan: ['#06B6D4', '#0891B2'],
  };

  const pieColors = [
    colors.primary,
    colors.secondary,
    colors.purple,
    colors.warning,
    colors.info,
    colors.pink,
    colors.indigo,
    colors.teal,
  ];

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!isAutoRefresh) return;

    const interval = setInterval(() => {
      handleRefresh();
    }, 30000);

    return () => clearInterval(interval);
  }, [isAutoRefresh]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      router.reload({ only: ['analytics', 'automation', 'performance', 'trends'] });
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setTimeout(() => setRefreshing(false), 1000);
    }
  };

  const formatCurrency = amount => {
    return `UGX ${Number(amount || 0).toLocaleString()}`;
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toString() || '0';
  };

  const formatPercentage = value => {
    return `${value >= 0 ? '+' : ''}${(value || 0).toFixed(1)}%`;
  };

  const getPerformanceColor = (value, threshold = 0) => {
    if (value >= threshold) return 'text-green-600';
    return 'text-red-600';
  };

  const getPerformanceIcon = (value, threshold = 0) => {
    if (value >= threshold) return 'bi-trending-up';
    return 'bi-trending-down';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-blue-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}:{' '}
              {entry.name.includes('Revenue') || entry.name.includes('Profit')
                ? formatCurrency(entry.value)
                : formatNumber(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <AuthenticatedLayout>
      <Head title="Enhanced Analytics Dashboard - MediTrack" />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-cyan-400/20 to-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-indigo-400/10 to-purple-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Professional Header */}
          <div className="relative bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 rounded-3xl p-8 shadow-2xl border border-slate-700/50 overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.1) 0%, transparent 50%), 
                               radial-gradient(circle at 75% 75%, rgba(147, 51, 234, 0.1) 0%, transparent 50%)`
            }}></div>
            
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                    <i className="bi bi-graph-up-arrow text-3xl text-white"></i>
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <i className="bi bi-check text-white text-xs"></i>
                  </div>
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">
                    Advanced Analytics Dashboard
                  </h1>
                  <p className="text-lg text-blue-100 mb-4">
                    Real-time insights and intelligent automation for your pharmacy
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-300 rounded-full border border-green-400/30">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">Live Data</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-300 rounded-full border border-blue-400/30">
                      <i className="bi bi-clock text-sm"></i>
                      <span className="text-sm font-mono-numbers">Updated: {lastUpdated.toLocaleTimeString()}</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-300 rounded-full border border-purple-400/30">
                      <i className="bi bi-shield-check text-sm"></i>
                      <span className="text-sm font-medium">Secure</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="relative">
                  <select
                    value={selectedTimeframe}
                    onChange={e => setSelectedTimeframe(e.target.value)}
                    className="appearance-none px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm pr-10"
                  >
                    <option value="7d" className="text-slate-900">Last 7 days</option>
                    <option value="30d" className="text-slate-900">Last 30 days</option>
                    <option value="90d" className="text-slate-900">Last 90 days</option>
                    <option value="1y" className="text-slate-900">Last year</option>
                  </select>
                  <i className="bi bi-chevron-down absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70 pointer-events-none"></i>
                </div>
                
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 backdrop-blur-sm border border-white/20"
                  title="Refresh Data"
                >
                  <i className={`bi bi-arrow-clockwise text-xl ${refreshing ? 'animate-spin' : ''}`}></i>
                </button>
                
                <button
                  onClick={() => setIsAutoRefresh(!isAutoRefresh)}
                  className={`p-3 rounded-xl transition-all duration-200 hover:scale-105 backdrop-blur-sm border ${
                    isAutoRefresh 
                      ? 'bg-green-500/20 hover:bg-green-500/30 text-green-300 border-green-400/30' 
                      : 'bg-white/10 hover:bg-white/20 text-white/70 border-white/20'
                  }`}
                  title={isAutoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
                >
                  <i className={`bi ${isAutoRefresh ? 'bi-play-circle-fill' : 'bi-pause-circle-fill'} text-xl`}></i>
                </button>

                <button
                  className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-200 hover:scale-105 backdrop-blur-sm border border-white/20"
                  title="Export Data"
                >
                  <i className="bi bi-download text-xl"></i>
                </button>
              </div>
            </div>
          </div>

          {/* Professional Navigation Tabs */}
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-1.5 shadow-xl border border-slate-200/50">
            <div className="flex space-x-1 overflow-x-auto">
              {[
                { id: 'overview', label: 'Overview', icon: 'bi-speedometer2', color: 'blue' },
                { id: 'sales', label: 'Sales Analytics', icon: 'bi-graph-up', color: 'green' },
                { id: 'inventory', label: 'Inventory', icon: 'bi-boxes', color: 'purple' },
                { id: 'financial', label: 'Financial', icon: 'bi-cash-coin', color: 'orange' },
                { id: 'predictive', label: 'AI Insights', icon: 'bi-robot', color: 'cyan' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-3 px-6 py-4 rounded-xl font-semibold transition-all duration-300 whitespace-nowrap ${
                    activeTab === tab.id
                      ? `bg-gradient-to-r ${
                          tab.color === 'blue' ? 'from-blue-500 to-indigo-600' :
                          tab.color === 'green' ? 'from-green-500 to-emerald-600' :
                          tab.color === 'purple' ? 'from-purple-500 to-violet-600' :
                          tab.color === 'orange' ? 'from-orange-500 to-red-600' :
                          'from-cyan-500 to-blue-600'
                        } text-white shadow-lg transform scale-105`
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {activeTab === tab.id && (
                    <div className="absolute inset-0 bg-white/20 rounded-xl animate-pulse"></div>
                  )}
                  <div className={`relative z-10 w-8 h-8 rounded-lg flex items-center justify-center ${
                    activeTab === tab.id 
                      ? 'bg-white/20' 
                      : `bg-${tab.color}-100`
                  }`}>
                    <i className={`${tab.icon} text-lg ${
                      activeTab === tab.id 
                        ? 'text-white' 
                        : `text-${tab.color}-600`
                    }`}></i>
                  </div>
                  <span className="relative z-10">{tab.label}</span>
                  {activeTab === tab.id && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              {/* Professional KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    title: 'Revenue Growth',
                    value: formatPercentage(performance?.sales_growth || 12.5),
                    subtitle: 'vs last month',
                    icon: 'bi-graph-up-arrow',
                    gradient: 'from-emerald-500 to-teal-600',
                    bgGradient: 'from-emerald-50 via-green-50 to-teal-50',
                    iconBg: 'bg-gradient-to-br from-emerald-400 to-teal-500',
                    iconColor: 'text-white',
                    trend: performance?.sales_growth || 12.5,
                    target: 15,
                  },
                  {
                    title: 'Inventory Turnover',
                    value: `${performance?.inventory_turnover || 4.2}x`,
                    subtitle: 'monthly ratio',
                    icon: 'bi-arrow-repeat',
                    gradient: 'from-blue-500 to-indigo-600',
                    bgGradient: 'from-blue-50 via-indigo-50 to-purple-50',
                    iconBg: 'bg-gradient-to-br from-blue-400 to-indigo-500',
                    iconColor: 'text-white',
                    trend: 5.2,
                    target: 6,
                  },
                  {
                    title: 'Customer Satisfaction',
                    value: `${performance?.customer_satisfaction || 94}%`,
                    subtitle: 'based on feedback',
                    icon: 'bi-emoji-smile',
                    gradient: 'from-purple-500 to-pink-600',
                    bgGradient: 'from-purple-50 via-violet-50 to-pink-50',
                    iconBg: 'bg-gradient-to-br from-purple-400 to-pink-500',
                    iconColor: 'text-white',
                    trend: 2.1,
                    target: 95,
                  },
                  {
                    title: 'Automation Score',
                    value: `${performance?.automation_efficiency || 87}%`,
                    subtitle: 'system efficiency',
                    icon: 'bi-robot',
                    gradient: 'from-orange-500 to-red-600',
                    bgGradient: 'from-orange-50 via-amber-50 to-red-50',
                    iconBg: 'bg-gradient-to-br from-orange-400 to-red-500',
                    iconColor: 'text-white',
                    trend: 8.7,
                    target: 90,
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
                        <p className="text-4xl font-bold text-slate-900 mb-2 font-mono-numbers tracking-tight">{card.value}</p>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${getPerformanceColor(card.trend)} bg-white/50`}>
                            <i className={`${getPerformanceIcon(card.trend)}`}></i>
                            {formatPercentage(card.trend)}
                          </span>
                          <span className="text-xs text-slate-600">{card.subtitle}</span>
                        </div>
                      </div>
                      <div className={`w-16 h-16 ${card.iconBg} rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                        <i className={`${card.icon} text-2xl ${card.iconColor} drop-shadow-sm`}></i>
                      </div>
                    </div>
                    
                    {/* Enhanced Progress Bar */}
                    <div className="relative z-10 mt-4">
                      <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
                        <span>Progress</span>
                        <span>{Math.round((card.trend / card.target) * 100)}% of target</span>
                      </div>
                      <div className="w-full bg-white/60 rounded-full h-3 shadow-inner">
                        <div 
                          className={`bg-gradient-to-r ${card.gradient} h-3 rounded-full transition-all duration-1000 shadow-sm relative overflow-hidden`}
                          style={{ width: `${Math.min(100, (Math.abs(card.trend) / card.target) * 100)}%` }}
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

              {/* Professional Analytics Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Enhanced Sales Performance Chart */}
                <div className="lg:col-span-2 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/60 relative overflow-hidden">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-5">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full transform translate-x-32 -translate-y-32"></div>
                  </div>

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl">
                          <i className="bi bi-graph-up text-white text-xl"></i>
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-slate-900 mb-1">Sales Performance</h3>
                          <p className="text-slate-600">Revenue trends and growth patterns</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-700 rounded-full text-sm font-semibold border border-blue-200">
                          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                          <span>Revenue</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-700 rounded-full text-sm font-semibold border border-green-200">
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                          <span>Profit</span>
                        </div>
                      </div>
                    </div>

                    {/* Professional Chart Container */}
                    <div className="relative h-80 bg-gradient-to-t from-slate-50/50 to-white/50 rounded-2xl p-6 border border-slate-200/30 shadow-inner backdrop-blur-sm">
                      <div className="flex items-end justify-between h-full">
                        {(trends?.daily_sales || [
                          { date: '2024-01-01', sales: 12000 },
                          { date: '2024-01-02', sales: 15000 },
                          { date: '2024-01-03', sales: 18000 },
                          { date: '2024-01-04', sales: 14000 },
                          { date: '2024-01-05', sales: 22000 },
                          { date: '2024-01-06', sales: 19000 },
                          { date: '2024-01-07', sales: 25000 },
                        ]).slice(-7).map((day, index) => {
                          const maxSales = Math.max(...(trends?.daily_sales || [
                            { sales: 12000 }, { sales: 15000 }, { sales: 18000 }, { sales: 14000 }, 
                            { sales: 22000 }, { sales: 19000 }, { sales: 25000 }
                          ]).slice(-7).map(d => d.sales || 0));
                          const height = maxSales > 0 ? Math.max(15, ((day.sales || 0) / maxSales) * 100) : 15;
                          
                          return (
                            <div key={index} className="flex-1 flex flex-col items-center group max-w-16 mx-1">
                              <div className="relative w-full">
                                {/* Enhanced Revenue Bar */}
                                <div
                                  className="w-full bg-gradient-to-t from-blue-600 via-blue-500 to-blue-400 rounded-t-xl transition-all duration-700 hover:from-blue-700 hover:to-blue-500 relative shadow-lg group-hover:shadow-xl"
                                  style={{ height: `${height}%` }}
                                >
                                  {/* Shine Effect */}
                                  <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-white/40 rounded-t-xl"></div>
                                  
                                  {/* Enhanced Tooltip */}
                                  <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-slate-900/90 text-white px-3 py-2 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap backdrop-blur-sm border border-white/10">
                                    <div className="font-semibold">{formatCurrency(day.sales || 0)}</div>
                                    <div className="text-xs text-slate-300">Revenue</div>
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900/90"></div>
                                  </div>
                                </div>
                                
                                {/* Enhanced Profit Bar Overlay */}
                                <div
                                  className="absolute bottom-0 w-full bg-gradient-to-t from-green-600 via-green-500 to-green-400 rounded-t-xl opacity-80 shadow-md"
                                  style={{ height: `${height * 0.65}%` }}
                                >
                                  <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white/30 rounded-t-xl"></div>
                                </div>
                              </div>
                              
                              <span className="text-sm text-slate-600 mt-4 font-semibold">
                                {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Enhanced Statistics */}
                    <div className="grid grid-cols-3 gap-6 mt-8 pt-6 border-t border-slate-200/50">
                      {[
                        {
                          label: 'Peak Day',
                          value: formatCurrency(Math.max(...(trends?.daily_sales || [{ sales: 25000 }]).slice(-7).map(d => d.sales || 0))),
                          icon: 'bi-trophy',
                          color: 'text-yellow-600',
                          bg: 'bg-yellow-100'
                        },
                        {
                          label: 'Average',
                          value: formatCurrency((trends?.daily_sales || [{ sales: 17857 }]).slice(-7).reduce((sum, d) => sum + (d.sales || 17857), 0) / 7),
                          icon: 'bi-graph-up',
                          color: 'text-blue-600',
                          bg: 'bg-blue-100'
                        },
                        {
                          label: 'Total Week',
                          value: formatCurrency((trends?.daily_sales || [{ sales: 125000 }]).slice(-7).reduce((sum, d) => sum + (d.sales || 17857), 0)),
                          icon: 'bi-cash-stack',
                          color: 'text-green-600',
                          bg: 'bg-green-100'
                        }
                      ].map((stat, index) => (
                        <div key={index} className="text-center p-4 bg-white/60 rounded-2xl border border-white/40 backdrop-blur-sm">
                          <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                            <i className={`${stat.icon} ${stat.color} text-lg`}></i>
                          </div>
                          <p className="text-sm text-slate-600 font-medium">{stat.label}</p>
                          <p className="text-xl font-bold text-slate-900 font-mono-numbers mt-1">
                            {stat.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Top Performing Medicines */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                      <i className="bi bi-trophy text-white text-lg"></i>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Top Performers</h3>
                      <p className="text-sm text-slate-600">Best selling medicines</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {(trends?.top_selling_medicines || []).slice(0, 5).map((medicine, index) => (
                      <div
                        key={index}
                        className="group flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-200/50 hover:shadow-lg transition-all duration-200"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg ${
                              index === 0
                                ? 'bg-gradient-to-br from-yellow-400 to-yellow-600'
                                : index === 1
                                  ? 'bg-gradient-to-br from-gray-400 to-gray-600'
                                  : index === 2
                                    ? 'bg-gradient-to-br from-orange-400 to-orange-600'
                                    : 'bg-gradient-to-br from-blue-400 to-blue-600'
                            }`}
                          >
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{medicine.name}</p>
                            <p className="text-sm text-slate-500">
                              <i className="bi bi-box mr-1"></i>
                              {formatNumber(medicine.quantity_sold)} units sold
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-emerald-600 font-mono-numbers">
                            {formatCurrency(medicine.revenue)}
                          </p>
                          <div className="w-16 bg-slate-200 rounded-full h-1.5 mt-1">
                            <div 
                              className="bg-gradient-to-r from-emerald-500 to-teal-500 h-1.5 rounded-full transition-all duration-1000"
                              style={{ width: `${Math.min(100, (medicine.revenue / Math.max(...(trends?.top_selling_medicines || []).map(m => m.revenue))) * 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* System Health & Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* System Health Dashboard */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                      <i className="bi bi-shield-check text-white text-lg"></i>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">System Health</h3>
                      <p className="text-sm text-slate-600">Real-time system monitoring</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { name: 'Database', status: 'excellent', uptime: '99.9%', icon: 'bi-database' },
                      { name: 'API Services', status: 'good', uptime: '99.7%', icon: 'bi-cloud' },
                      { name: 'Automation', status: 'excellent', uptime: '100%', icon: 'bi-robot' },
                      { name: 'Backup System', status: 'warning', uptime: '98.5%', icon: 'bi-shield' },
                    ].map((system, index) => (
                      <div key={index} className="p-4 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200/50">
                        <div className="flex items-center justify-between mb-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            system.status === 'excellent' ? 'bg-green-100' :
                            system.status === 'good' ? 'bg-blue-100' :
                            system.status === 'warning' ? 'bg-yellow-100' : 'bg-red-100'
                          }`}>
                            <i className={`${system.icon} ${
                              system.status === 'excellent' ? 'text-green-600' :
                              system.status === 'good' ? 'text-blue-600' :
                              system.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                            }`}></i>
                          </div>
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(system.status)} animate-pulse`}></div>
                        </div>
                        <p className="font-semibold text-slate-900 text-sm">{system.name}</p>
                        <p className="text-xs text-slate-500">Uptime: {system.uptime}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <i className="bi bi-lightning text-white text-lg"></i>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Smart Actions</h3>
                      <p className="text-sm text-slate-600">AI-powered recommendations</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[
                      {
                        title: 'Reorder Suggestions',
                        description: `${automation?.reorder_suggestions?.total || 0} items need attention`,
                        icon: 'bi-arrow-repeat',
                        color: 'blue',
                        route: '/automation/reorder-suggestions'
                      },
                      {
                        title: 'Expiry Alerts',
                        description: `${automation?.expiry_reminders?.total || 0} items expiring soon`,
                        icon: 'bi-clock-history',
                        color: 'orange',
                        route: '/automation/expiry-reminders'
                      },
                      {
                        title: 'Generate Reports',
                        description: 'Export detailed analytics',
                        icon: 'bi-file-earmark-bar-graph',
                        color: 'green',
                        route: '/reports'
                      },
                      {
                        title: 'Inventory Optimization',
                        description: 'AI-powered stock recommendations',
                        icon: 'bi-boxes',
                        color: 'purple',
                        route: '/medicines'
                      }
                    ].map((action, index) => (
                      <a
                        key={index}
                        href={action.route}
                        className={`group flex items-center justify-between p-4 bg-gradient-to-r from-${action.color}-50 to-white rounded-xl border border-${action.color}-200/50 hover:shadow-lg transition-all duration-200 hover:scale-[1.02]`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 bg-${action.color}-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                            <i className={`${action.icon} text-${action.color}-600 text-lg`}></i>
                          </div>
                          <div>
                            <p className={`font-semibold text-${action.color}-900`}>{action.title}</p>
                            <p className={`text-sm text-${action.color}-700`}>{action.description}</p>
                          </div>
                        </div>
                        <i className={`bi bi-arrow-right text-${action.color}-600 group-hover:translate-x-1 transition-transform duration-200`}></i>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Sales Analytics Tab */}
          {activeTab === 'sales' && (
            <div className="space-y-6">
              {/* Sales Performance Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    title: "Today's Revenue",
                    value: formatCurrency(analytics?.sales_analytics?.daily?.today || 0),
                    subtitle: 'vs yesterday',
                    icon: 'bi-cash-coin',
                    gradient: 'from-emerald-500 to-teal-600',
                    bgGradient: 'from-emerald-50 to-teal-50',
                    iconBg: 'bg-emerald-100',
                    iconColor: 'text-emerald-600',
                    trend: analytics?.sales_analytics?.daily?.growth || 0,
                  },
                  {
                    title: 'Weekly Revenue',
                    value: formatCurrency(analytics?.sales_analytics?.weekly?.this_week || 0),
                    subtitle: 'this week',
                    icon: 'bi-calendar-week',
                    gradient: 'from-blue-500 to-indigo-600',
                    bgGradient: 'from-blue-50 to-indigo-50',
                    iconBg: 'bg-blue-100',
                    iconColor: 'text-blue-600',
                    trend: analytics?.sales_analytics?.weekly?.growth || 0,
                  },
                  {
                    title: 'Monthly Revenue',
                    value: formatCurrency(analytics?.sales_analytics?.monthly?.this_month || 0),
                    subtitle: 'this month',
                    icon: 'bi-calendar-month',
                    gradient: 'from-purple-500 to-pink-600',
                    bgGradient: 'from-purple-50 to-pink-50',
                    iconBg: 'bg-purple-100',
                    iconColor: 'text-purple-600',
                    trend: analytics?.sales_analytics?.monthly?.growth || 0,
                  },
                  {
                    title: 'Peak Hour Sales',
                    value: `${analytics?.performance_metrics?.sales_performance?.peak_hour || 12}:00`,
                    subtitle: 'busiest hour',
                    icon: 'bi-clock',
                    gradient: 'from-orange-500 to-red-600',
                    bgGradient: 'from-orange-50 to-red-50',
                    iconBg: 'bg-orange-100',
                    iconColor: 'text-orange-600',
                    trend: 0,
                  }
                ].map((card, index) => (
                  <div
                    key={card.title}
                    className={`group relative bg-gradient-to-br ${card.bgGradient} rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-white/50 backdrop-blur-sm`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-600 mb-2">{card.title}</p>
                        <p className="text-2xl font-bold text-slate-900 mb-1 font-mono-numbers">{card.value}</p>
                        <div className="flex items-center gap-2">
                          {card.trend !== 0 && (
                            <span className={`text-sm font-medium ${getPerformanceColor(card.trend)}`}>
                              <i className={`${getPerformanceIcon(card.trend)} mr-1`}></i>
                              {formatPercentage(card.trend)}
                            </span>
                          )}
                          <span className="text-xs text-slate-500">{card.subtitle}</span>
                        </div>
                      </div>
                      <div className={`w-14 h-14 ${card.iconBg} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <i className={`${card.icon} text-2xl ${card.iconColor}`}></i>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Advanced Sales Trends Chart */}
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                      <i className="bi bi-graph-up text-white text-lg"></i>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Sales Trends Analysis</h3>
                      <p className="text-sm text-slate-600">Revenue and profit trends over time</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Revenue</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Profit</span>
                    </div>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={trends?.daily_sales || []}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={colors.primary} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={colors.primary} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={colors.secondary} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={colors.secondary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="day"
                      stroke="#6b7280"
                      fontSize={12}
                    />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke={colors.primary}
                      fillOpacity={1}
                      fill="url(#revenueGradient)"
                      name="Revenue"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="profit"
                      stroke={colors.secondary}
                      fillOpacity={1}
                      fill="url(#profitGradient)"
                      name="Profit"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Payment Methods Analysis */}
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                      <i className="bi bi-credit-card text-white text-lg"></i>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Payment Methods</h3>
                      <p className="text-sm text-slate-600">Transaction distribution by payment type</p>
                    </div>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { method: 'Cash', amount: 45000, percentage: 45 },
                        { method: 'Card', amount: 35000, percentage: 35 },
                        { method: 'Mobile', amount: 15000, percentage: 15 },
                        { method: 'Insurance', amount: 5000, percentage: 5 },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ method, percentage }) => `${method}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                    >
                      {pieColors.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={value => [formatCurrency(value), 'Amount']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Best Selling Medicines Chart */}
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                    <i className="bi bi-award text-white text-lg"></i>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Best Selling Medicines</h3>
                    <p className="text-sm text-slate-600">Top performers by revenue</p>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={350}>
                  <BarChart 
                    data={(analytics?.sales_analytics?.top_medicines || []).slice(0, 8).map(medicine => ({
                      name: medicine.medicine?.name || 'Unknown',
                      quantity: medicine.total_quantity || 0,
                      revenue: medicine.total_revenue || 0,
                    }))} 
                    layout="horizontal"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" stroke="#6b7280" fontSize={12} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      stroke="#6b7280"
                      fontSize={12}
                      width={120}
                    />
                    <Tooltip
                      formatter={(value, name) => [
                        name === 'quantity' ? formatNumber(value) : formatCurrency(value),
                        name === 'quantity' ? 'Quantity Sold' : 'Revenue',
                      ]}
                    />
                    <Bar dataKey="revenue" fill={colors.primary} name="revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Inventory Analytics Tab */}
          {activeTab === 'inventory' && (
            <div className="space-y-6">
              {/* Inventory Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    title: 'Total Medicines',
                    value: formatNumber(analytics?.inventory_analytics?.overview?.total_medicines || 0),
                    subtitle: 'in inventory',
                    icon: 'bi-capsule-pill',
                    gradient: 'from-blue-500 to-indigo-600',
                    bgGradient: 'from-blue-50 to-indigo-50',
                    iconBg: 'bg-blue-100',
                    iconColor: 'text-blue-600',
                  },
                  {
                    title: 'Low Stock Items',
                    value: formatNumber(analytics?.inventory_analytics?.overview?.low_stock_count || 0),
                    subtitle: `${analytics?.inventory_analytics?.overview?.low_stock_percentage || 0}% of total`,
                    icon: 'bi-exclamation-triangle',
                    gradient: 'from-yellow-500 to-orange-600',
                    bgGradient: 'from-yellow-50 to-orange-50',
                    iconBg: 'bg-yellow-100',
                    iconColor: 'text-yellow-600',
                  },
                  {
                    title: 'Out of Stock',
                    value: formatNumber(analytics?.inventory_analytics?.overview?.out_of_stock_count || 0),
                    subtitle: 'items unavailable',
                    icon: 'bi-x-circle',
                    gradient: 'from-red-500 to-pink-600',
                    bgGradient: 'from-red-50 to-pink-50',
                    iconBg: 'bg-red-100',
                    iconColor: 'text-red-600',
                  },
                  {
                    title: 'Expiring Soon',
                    value: formatNumber(analytics?.inventory_analytics?.overview?.expiring_count || 0),
                    subtitle: 'within 30 days',
                    icon: 'bi-clock-history',
                    gradient: 'from-purple-500 to-indigo-600',
                    bgGradient: 'from-purple-50 to-indigo-50',
                    iconBg: 'bg-purple-100',
                    iconColor: 'text-purple-600',
                  }
                ].map((card, index) => (
                  <div
                    key={card.title}
                    className={`group relative bg-gradient-to-br ${card.bgGradient} rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-white/50 backdrop-blur-sm`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-600 mb-2">{card.title}</p>
                        <p className="text-3xl font-bold text-slate-900 mb-1 font-mono-numbers">{card.value}</p>
                        <p className="text-xs text-slate-500">{card.subtitle}</p>
                      </div>
                      <div className={`w-14 h-14 ${card.iconBg} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <i className={`${card.icon} text-2xl ${card.iconColor}`}></i>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Inventory Value & Turnover */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                      <i className="bi bi-cash-coin text-white text-lg"></i>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Inventory Valuation</h3>
                      <p className="text-sm text-slate-600">Current stock value</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-green-700 font-medium">Total Value</p>
                          <p className="text-2xl font-bold text-green-900 font-mono-numbers">
                            {formatCurrency(analytics?.inventory_analytics?.valuation?.total_value || 0)}
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                          <i className="bi bi-cash-stack text-green-600 text-xl"></i>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-yellow-700 font-medium">At Risk Value</p>
                          <p className="text-xl font-bold text-yellow-900 font-mono-numbers">
                            {formatCurrency(analytics?.inventory_analytics?.valuation?.low_stock_value || 0)}
                          </p>
                          <p className="text-xs text-yellow-600">
                            {analytics?.inventory_analytics?.valuation?.at_risk_percentage || 0}% of total
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                          <i className="bi bi-exclamation-triangle text-yellow-600 text-xl"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                      <i className="bi bi-arrow-repeat text-white text-lg"></i>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Inventory Turnover</h3>
                      <p className="text-sm text-slate-600">Performance metrics</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200/50">
                      <p className="text-3xl font-bold text-blue-900 font-mono-numbers">
                        {analytics?.inventory_analytics?.turnover?.ratio || 0}x
                      </p>
                      <p className="text-sm text-blue-700 font-medium mt-1">Turnover Ratio</p>
                      <p className="text-xs text-blue-600 mt-2">
                        Performance: {analytics?.inventory_analytics?.turnover?.performance || 'Good'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-slate-600">COGS</p>
                        <p className="font-bold text-slate-900 font-mono-numbers">
                          {formatCurrency(analytics?.inventory_analytics?.turnover?.cogs || 0)}
                        </p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-slate-600">Avg Inventory</p>
                        <p className="font-bold text-slate-900 font-mono-numbers">
                          {formatCurrency(analytics?.inventory_analytics?.turnover?.avg_inventory || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stock Distribution Chart */}
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                    <i className="bi bi-pie-chart text-white text-lg"></i>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Stock Distribution</h3>
                    <p className="text-sm text-slate-600">Inventory status breakdown</p>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        {
                          name: 'In Stock',
                          value: analytics?.inventory_analytics?.overview?.total_medicines - (analytics?.inventory_analytics?.overview?.out_of_stock_count || 0) || 0,
                          color: colors.secondary,
                        },
                        {
                          name: 'Low Stock',
                          value: analytics?.inventory_analytics?.overview?.low_stock_count || 0,
                          color: colors.accent,
                        },
                        {
                          name: 'Out of Stock',
                          value: analytics?.inventory_analytics?.overview?.out_of_stock_count || 0,
                          color: colors.danger,
                        },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, percent }) =>
                        `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[colors.secondary, colors.accent, colors.danger].map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Expiring Medicines Table */}
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50">
                <div className="p-6 border-b border-slate-200/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center">
                        <i className="bi bi-clock-history text-white text-lg"></i>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">Expiring Medicines</h3>
                        <p className="text-sm text-slate-600">Items expiring within 30 days</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <i className="bi bi-exclamation-triangle text-red-600"></i>
                      <span className="text-sm font-medium text-red-600">
                        {analytics?.inventory_analytics?.overview?.expiring_count || 0} critical
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-4 max-h-80 overflow-y-auto">
                    {[
                      { id: 1, name: 'Paracetamol 500mg', brand: 'Generic', batch_number: 'PAR001', days_to_expiry: 5, stock_quantity: 50, urgency: 'critical' },
                      { id: 2, name: 'Amoxicillin 250mg', brand: 'Amoxil', batch_number: 'AMX002', days_to_expiry: 12, stock_quantity: 30, urgency: 'warning' },
                      { id: 3, name: 'Ibuprofen 400mg', brand: 'Advil', batch_number: 'IBU003', days_to_expiry: 18, stock_quantity: 25, urgency: 'warning' },
                      { id: 4, name: 'Aspirin 100mg', brand: 'Bayer', batch_number: 'ASP004', days_to_expiry: 25, stock_quantity: 40, urgency: 'warning' },
                      { id: 5, name: 'Omeprazole 20mg', brand: 'Prilosec', batch_number: 'OME005', days_to_expiry: 28, stock_quantity: 35, urgency: 'warning' },
                    ].map(medicine => (
                      <div
                        key={medicine.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                      >
                        <div>
                          <h4 className="font-medium text-slate-900">{medicine.name}</h4>
                          <p className="text-sm text-slate-600">{medicine.brand}</p>
                          <p className="text-xs text-slate-500">Batch: {medicine.batch_number}</p>
                        </div>
                        <div className="text-right">
                          <div
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              medicine.urgency === 'critical'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {medicine.days_to_expiry} days
                          </div>
                          <p className="text-sm text-slate-600 mt-1">
                            Stock: {medicine.stock_quantity}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Financial Analytics Tab */}
          {activeTab === 'financial' && (
            <div className="space-y-6">
              {/* Financial Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    title: 'Monthly Revenue',
                    value: formatCurrency(analytics?.financial_analytics?.revenue?.this_month || 0),
                    subtitle: `${formatPercentage(analytics?.financial_analytics?.revenue?.growth || 0)} vs last month`,
                    icon: 'bi-graph-up-arrow',
                    gradient: 'from-emerald-500 to-teal-600',
                    bgGradient: 'from-emerald-50 to-teal-50',
                    iconBg: 'bg-emerald-100',
                    iconColor: 'text-emerald-600',
                    trend: analytics?.financial_analytics?.revenue?.growth || 0,
                  },
                  {
                    title: 'Gross Profit',
                    value: formatCurrency(analytics?.financial_analytics?.profitability?.gross_profit || 0),
                    subtitle: `${analytics?.financial_analytics?.profitability?.profit_margin || 0}% margin`,
                    icon: 'bi-cash-coin',
                    gradient: 'from-blue-500 to-indigo-600',
                    bgGradient: 'from-blue-50 to-indigo-50',
                    iconBg: 'bg-blue-100',
                    iconColor: 'text-blue-600',
                    trend: analytics?.financial_analytics?.profitability?.profit_margin || 0,
                  },
                  {
                    title: 'Cost of Goods',
                    value: formatCurrency(analytics?.financial_analytics?.profitability?.cost_of_goods || 0),
                    subtitle: 'monthly COGS',
                    icon: 'bi-box-seam',
                    gradient: 'from-orange-500 to-red-600',
                    bgGradient: 'from-orange-50 to-red-50',
                    iconBg: 'bg-orange-100',
                    iconColor: 'text-orange-600',
                    trend: 0,
                  },
                  {
                    title: 'Avg Transaction',
                    value: formatCurrency(analytics?.financial_analytics?.customer_metrics?.avg_transaction_value || 0),
                    subtitle: 'per transaction',
                    icon: 'bi-receipt',
                    gradient: 'from-purple-500 to-pink-600',
                    bgGradient: 'from-purple-50 to-pink-50',
                    iconBg: 'bg-purple-100',
                    iconColor: 'text-purple-600',
                    trend: 0,
                  }
                ].map((card, index) => (
                  <div
                    key={card.title}
                    className={`group relative bg-gradient-to-br ${card.bgGradient} rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-white/50 backdrop-blur-sm`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-600 mb-2">{card.title}</p>
                        <p className="text-2xl font-bold text-slate-900 mb-1 font-mono-numbers">{card.value}</p>
                        <div className="flex items-center gap-2">
                          {card.trend !== 0 && (
                            <span className={`text-sm font-medium ${getPerformanceColor(card.trend)}`}>
                              <i className={`${getPerformanceIcon(card.trend)} mr-1`}></i>
                            </span>
                          )}
                          <span className="text-xs text-slate-500">{card.subtitle}</span>
                        </div>
                      </div>
                      <div className={`w-14 h-14 ${card.iconBg} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <i className={`${card.icon} text-2xl ${card.iconColor}`}></i>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Customer Metrics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                      <i className="bi bi-people text-white text-lg"></i>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Customer Analytics</h3>
                      <p className="text-sm text-slate-600">Customer engagement metrics</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200/50">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-900 font-mono-numbers">
                          {formatNumber(analytics?.financial_analytics?.customer_metrics?.total_customers || 0)}
                        </p>
                        <p className="text-sm text-blue-700 font-medium">Total Customers</p>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200/50">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-900 font-mono-numbers">
                          {formatNumber(analytics?.financial_analytics?.customer_metrics?.active_customers || 0)}
                        </p>
                        <p className="text-sm text-green-700 font-medium">Active Customers</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-purple-700 font-medium">Customer Retention</p>
                        <p className="text-xl font-bold text-purple-900 font-mono-numbers">
                          {analytics?.financial_analytics?.customer_metrics?.customer_retention || 0}%
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <i className="bi bi-heart text-purple-600 text-xl"></i>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                      <i className="bi bi-graph-up text-white text-lg"></i>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Profitability Analysis</h3>
                      <p className="text-sm text-slate-600">Profit margins and trends</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200/50">
                      <p className="text-3xl font-bold text-green-900 font-mono-numbers">
                        {analytics?.financial_analytics?.profitability?.profit_margin || 0}%
                      </p>
                      <p className="text-sm text-green-700 font-medium mt-1">Profit Margin</p>
                      <p className="text-xs text-green-600 mt-2">
                        {analytics?.financial_analytics?.profitability?.profit_margin > 20 ? 'Excellent' : 
                         analytics?.financial_analytics?.profitability?.profit_margin > 15 ? 'Good' : 
                         analytics?.financial_analytics?.profitability?.profit_margin > 10 ? 'Average' : 'Needs Improvement'}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <span className="text-slate-600 text-sm">Revenue Growth</span>
                        <span className={`font-bold ${getPerformanceColor(analytics?.financial_analytics?.revenue?.growth || 0)}`}>
                          {formatPercentage(analytics?.financial_analytics?.revenue?.growth || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <span className="text-slate-600 text-sm">This Month</span>
                        <span className="font-bold text-slate-900 font-mono-numbers">
                          {formatCurrency(analytics?.financial_analytics?.revenue?.this_month || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <span className="text-slate-600 text-sm">Last Month</span>
                        <span className="font-bold text-slate-900 font-mono-numbers">
                          {formatCurrency(analytics?.financial_analytics?.revenue?.last_month || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Customers Analysis */}
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50">
                <div className="p-6 border-b border-slate-200/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <i className="bi bi-people text-white text-lg"></i>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">Top Customers</h3>
                        <p className="text-sm text-slate-600">Highest value customers</p>
                      </div>
                    </div>
                    <span className="text-sm text-slate-600">Last 90 days</span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-4 max-h-80 overflow-y-auto">
                    {[
                      { id: 1, name: 'John Smith', email: 'john.smith@email.com', total_spent: 2500, transaction_count: 15 },
                      { id: 2, name: 'Sarah Johnson', email: 'sarah.j@email.com', total_spent: 1800, transaction_count: 12 },
                      { id: 3, name: 'Michael Brown', email: 'mike.brown@email.com', total_spent: 1600, transaction_count: 10 },
                      { id: 4, name: 'Emily Davis', email: 'emily.davis@email.com', total_spent: 1400, transaction_count: 8 },
                      { id: 5, name: 'David Wilson', email: 'david.w@email.com', total_spent: 1200, transaction_count: 9 },
                      { id: 6, name: 'Lisa Anderson', email: 'lisa.anderson@email.com', total_spent: 1100, transaction_count: 7 },
                    ].map((customer, index) => (
                      <div
                        key={customer.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-indigo-600">{index + 1}</span>
                          </div>
                          <div>
                            <h4 className="font-medium text-slate-900">{customer.name}</h4>
                            <p className="text-sm text-slate-600">{customer.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-slate-900">
                            {formatCurrency(customer.total_spent)}
                          </p>
                          <p className="text-sm text-slate-600">{customer.transaction_count} orders</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI Insights Tab */}
          {activeTab === 'predictive' && (
            <div className="space-y-6">
              {/* AI Insights Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    title: 'Sales Forecast',
                    value: formatCurrency(analytics?.predictive_insights?.sales_forecast?.next_week_forecast || 0),
                    subtitle: 'next week prediction',
                    icon: 'bi-crystal-ball',
                    gradient: 'from-indigo-500 to-purple-600',
                    bgGradient: 'from-indigo-50 to-purple-50',
                    iconBg: 'bg-indigo-100',
                    iconColor: 'text-indigo-600',
                    confidence: analytics?.predictive_insights?.sales_forecast?.confidence_level || 0,
                  },
                  {
                    title: 'Reorder Alerts',
                    value: formatNumber(analytics?.predictive_insights?.inventory_recommendations?.reorder_now || 0),
                    subtitle: 'items need reordering',
                    icon: 'bi-arrow-repeat',
                    gradient: 'from-orange-500 to-red-600',
                    bgGradient: 'from-orange-50 to-red-50',
                    iconBg: 'bg-orange-100',
                    iconColor: 'text-orange-600',
                    confidence: 95,
                  },
                  {
                    title: 'Price Optimization',
                    value: formatNumber(analytics?.predictive_insights?.inventory_recommendations?.review_pricing || 0),
                    subtitle: 'items for review',
                    icon: 'bi-tags',
                    gradient: 'from-green-500 to-emerald-600',
                    bgGradient: 'from-green-50 to-emerald-50',
                    iconBg: 'bg-green-100',
                    iconColor: 'text-green-600',
                    confidence: 88,
                  }
                ].map((card, index) => (
                  <div
                    key={card.title}
                    className={`group relative bg-gradient-to-br ${card.bgGradient} rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-white/50 backdrop-blur-sm`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-600 mb-2">{card.title}</p>
                        <p className="text-2xl font-bold text-slate-900 mb-1 font-mono-numbers">{card.value}</p>
                        <p className="text-xs text-slate-500">{card.subtitle}</p>
                      </div>
                      <div className={`w-14 h-14 ${card.iconBg} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <i className={`${card.icon} text-2xl ${card.iconColor}`}></i>
                      </div>
                    </div>
                    
                    {/* Confidence Indicator */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                        <span>Confidence</span>
                        <span>{card.confidence}%</span>
                      </div>
                      <div className="w-full bg-white/50 rounded-full h-2">
                        <div 
                          className={`bg-gradient-to-r ${card.gradient} h-2 rounded-full transition-all duration-1000`}
                          style={{ width: `${card.confidence}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Business Opportunities */}
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                    <i className="bi bi-lightbulb text-white text-lg"></i>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Business Opportunities</h3>
                    <p className="text-sm text-slate-600">AI-identified growth opportunities</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200/50">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <i className="bi bi-graph-up-arrow text-green-600 text-xl"></i>
                      </div>
                      <p className="text-2xl font-bold text-green-900 font-mono-numbers">
                        {formatNumber(analytics?.predictive_insights?.business_opportunities?.high_margin_products || 0)}
                      </p>
                      <p className="text-sm text-green-700 font-medium">High Margin Products</p>
                      <p className="text-xs text-green-600 mt-1">Focus on promoting these items</p>
                    </div>
                  </div>

                  <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200/50">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <i className="bi bi-speedometer2 text-blue-600 text-xl"></i>
                      </div>
                      <p className="text-2xl font-bold text-blue-900 font-mono-numbers">
                        {formatNumber(analytics?.predictive_insights?.business_opportunities?.fast_moving_items || 0)}
                      </p>
                      <p className="text-sm text-blue-700 font-medium">Fast Moving Items</p>
                      <p className="text-xs text-blue-600 mt-1">Ensure adequate stock levels</p>
                    </div>
                  </div>

                  <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200/50">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <i className="bi bi-people text-purple-600 text-xl"></i>
                      </div>
                      <p className="text-2xl font-bold text-purple-900 font-mono-numbers">
                        {formatNumber(analytics?.predictive_insights?.business_opportunities?.customer_segments || 0)}
                      </p>
                      <p className="text-sm text-purple-700 font-medium">Customer Segments</p>
                      <p className="text-xs text-purple-600 mt-1">Potential for targeted marketing</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Recommendations */}
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <i className="bi bi-robot text-white text-lg"></i>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">AI Recommendations</h3>
                    <p className="text-sm text-slate-600">Smart suggestions for your pharmacy</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      title: 'Optimize Stock Levels',
                      description: `${analytics?.predictive_insights?.inventory_recommendations?.optimize_stock || 0} items have excess stock that could be reduced`,
                      action: 'Review Inventory',
                      icon: 'bi-boxes',
                      color: 'blue',
                      priority: 'medium'
                    },
                    {
                      title: 'Price Review Needed',
                      description: `${analytics?.predictive_insights?.inventory_recommendations?.review_pricing || 0} items may benefit from price adjustments`,
                      action: 'Review Pricing',
                      icon: 'bi-tags',
                      color: 'green',
                      priority: 'low'
                    },
                    {
                      title: 'Reorder Critical Items',
                      description: `${analytics?.predictive_insights?.inventory_recommendations?.reorder_now || 0} items are critically low and need immediate reordering`,
                      action: 'Place Orders',
                      icon: 'bi-exclamation-triangle',
                      color: 'red',
                      priority: 'high'
                    },
                    {
                      title: 'Sales Forecast Confidence',
                      description: `Next week's sales forecast has ${analytics?.predictive_insights?.sales_forecast?.confidence_level || 0}% confidence level`,
                      action: 'View Forecast',
                      icon: 'bi-graph-up',
                      color: 'purple',
                      priority: 'info'
                    }
                  ].map((recommendation, index) => (
                    <div
                      key={index}
                      className={`group flex items-center justify-between p-4 bg-gradient-to-r from-${recommendation.color}-50 to-white rounded-xl border border-${recommendation.color}-200/50 hover:shadow-lg transition-all duration-200`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 bg-${recommendation.color}-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                          <i className={`${recommendation.icon} text-${recommendation.color}-600 text-lg`}></i>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className={`font-semibold text-${recommendation.color}-900`}>{recommendation.title}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              recommendation.priority === 'high' ? 'bg-red-100 text-red-700' :
                              recommendation.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              recommendation.priority === 'low' ? 'bg-green-100 text-green-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {recommendation.priority}
                            </span>
                          </div>
                          <p className={`text-sm text-${recommendation.color}-700 mt-1`}>{recommendation.description}</p>
                        </div>
                      </div>
                      <button className={`px-4 py-2 bg-${recommendation.color}-100 hover:bg-${recommendation.color}-200 text-${recommendation.color}-700 rounded-lg font-medium text-sm transition-colors duration-200`}>
                        {recommendation.action}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
