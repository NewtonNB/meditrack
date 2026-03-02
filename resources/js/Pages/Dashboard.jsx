import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import AutomationWidget from '@/Components/Automation/AutomationWidget';
import EnhancedActivityTracker from '@/Components/EnhancedActivityTracker';
import ErrorBoundary from '@/Components/ErrorBoundary';
import 'bootstrap-icons/font/bootstrap-icons.css';
import SalesTrendsCard from '@/Components/Charts/SalesTrendsCard';
import MobileDashboard from '@/Components/MobileOptimized/MobileDashboard';
import { useRealTimeUpdates } from '@/Hooks/useRealTimeUpdates';



export default function Dashboard({ stats = {}, recentActivities = [], quickInsights = [] }) {
  // Ensure stats has safe defaults - handle both undefined and null
  const safeStats = React.useMemo(() => ({
    medicines: stats?.medicines || { total: 0, low_stock: 0, expiring_soon: 0 },
    sales: stats?.sales || { today: 0, today_revenue: 0, this_month: 0, this_month_revenue: 0 },
    customers: stats?.customers || { total: 0, new_this_month: 0 },
    suppliers: stats?.suppliers || { total: 0, active: 0 },
  }), [stats]);

  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isAutoRefresh, setIsAutoRefresh] = useState(false); // Disabled by default to prevent errors
  const [isMobile, setIsMobile] = useState(false);

  // Use real-time updates hook
  useRealTimeUpdates({
    pageName: 'dashboard',
    dataKeys: ['stats', 'recentActivities', 'quickInsights'],
    onUpdate: (eventType, data) => {
      console.log(`Dashboard updated due to: ${eventType}`, JSON.stringify(data));
      setLastUpdated(new Date());
    }
  });
  
  // Use ONLY backend stats - disable hooks to prevent errors
  const customerStats = {
    total: safeStats?.customers?.total || 0,
    withEmail: 0,
    withPhone: 0,
    newThisMonth: safeStats?.customers?.new_this_month || 0
  };
  
  const medicineStats = {
    total: safeStats?.medicines?.total || 0,
    lowStock: safeStats?.medicines?.low_stock || 0,
    outOfStock: 0,
    expiringSoon: safeStats?.medicines?.expiring_soon || 0
  };
  
  const salesStats = {
    total: 0,
    todayTotal: safeStats?.sales?.today_revenue || 0,
    todayCount: safeStats?.sales?.today || 0,
    weeklyTotal: 0,
    monthlyTotal: safeStats?.sales?.this_month_revenue || 0
  };

  // Auto-refresh every 30 seconds (only if enabled)
  useEffect(() => {
    if (!isAutoRefresh) return;

    const interval = setInterval(() => {
      try {
        router.reload({ 
          only: ['stats', 'recentActivities', 'quickInsights'],
          preserveState: true,
          preserveScroll: true,
          onSuccess: () => {
            setLastUpdated(new Date());
          },
          onError: (errors) => {
            setIsAutoRefresh(false); // Disable auto-refresh on error
          }
        });
      } catch (error) {
        setIsAutoRefresh(false); // Disable auto-refresh on error
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [isAutoRefresh]);

  // Detect mobile layout
  useEffect(() => {
    const update = () => setIsMobile(window.matchMedia('(max-width: 640px)').matches);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Auto-refresh when page becomes visible (user returns to dashboard)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Refresh dashboard data when user returns to the page
        router.reload({ 
          only: ['stats', 'recentActivities', 'quickInsights'],
          preserveState: true,
          preserveScroll: true,
          onSuccess: () => {
            setLastUpdated(new Date());
          }
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);



  // Refresh dashboard when navigating back from other pages
  useEffect(() => {
    const handleFocus = () => {
      router.reload({ 
        only: ['stats', 'recentActivities', 'quickInsights'],
        preserveState: true,
        preserveScroll: true,
        onSuccess: () => {
          setLastUpdated(new Date());
        }
      });
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const handleManualRefresh = () => {
    router.reload({ 
      only: ['stats', 'recentActivities', 'quickInsights'],
      onSuccess: () => {
        setLastUpdated(new Date());
        // Show a brief success indicator
        const refreshBtn = document.querySelector('[title="Refresh Dashboard"]');
        if (refreshBtn) {
          refreshBtn.classList.add('text-green-600');
          setTimeout(() => refreshBtn.classList.remove('text-green-600'), 1000);
        }
      }
    });
  };



  if (isMobile) {
    return (
      <AuthenticatedLayout>
        <Head>
          <title>Dashboard</title>
        </Head>
        <MobileDashboard stats={safeStats} quickInsights={quickInsights} recentActivities={recentActivities} />
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <Head>
        <title>Dashboard - MediTrack</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50 to-primary-100 relative">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary-300/10 to-accent-400/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-accent-300/10 to-primary-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-primary-300/8 to-neutral-400/8 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>



        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Welcome Header */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/50">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-gradient-to-br from-accent-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <i className="bi bi-house-heart-fill text-3xl text-white"></i>
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-700 to-accent-600 bg-clip-text text-transparent">
                    Welcome Back!
                  </h1>
                  <p className="text-lg text-slate-600 mt-2">
                    Here's what's happening at your pharmacy today
                  </p>
                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">All Systems Online</span>
                    </div>
                    <div className="px-4 py-2 bg-slate-100 text-slate-600 rounded-full">
                      <span className="text-sm font-mono-numbers">Updated: {lastUpdated.toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={handleManualRefresh}
                  className="p-3 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-xl transition-all duration-200 hover:scale-105"
                  title="Refresh Dashboard"
                >
                  <i className="bi bi-arrow-clockwise text-xl"></i>
                </button>
                
                <button
                  onClick={() => setIsAutoRefresh(!isAutoRefresh)}
                  className={`p-3 rounded-xl transition-all duration-200 hover:scale-105 ${
                    isAutoRefresh 
                      ? 'bg-green-100 hover:bg-green-200 text-green-600' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                  title={isAutoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
                >
                  <i className={`bi ${isAutoRefresh ? 'bi-play-circle-fill' : 'bi-pause-circle-fill'} text-xl`}></i>
                </button>
              </div>
            </div>
          </div>

          {/* Professional Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'Total Medicines',
                value: medicineStats?.total || 0,
                subtitle: `${medicineStats?.lowStock || 0} low stock`,
                icon: 'bi-capsule-pill',
                gradient: 'from-emerald-500 to-teal-600',
                bgGradient: 'from-emerald-50 to-teal-50',
                iconBg: 'bg-emerald-100',
                iconColor: 'text-emerald-600',
                link: '/medicines',
                action: 'View All Medicines'
              },
              {
                title: 'Today\'s Sales',
                value: `UGX ${(salesStats?.todayTotal || 0).toLocaleString()}`,
                subtitle: `${salesStats?.todayCount || 0} transactions`,
                icon: 'bi-graph-up-arrow',
                gradient: 'from-accent-500 to-primary-600',
                bgGradient: 'from-accent-50 to-primary-50',
                iconBg: 'bg-accent-100',
                iconColor: 'text-accent-600',
                link: '/sales',
                action: 'View Sales'
              },
              {
                title: 'Active Customers',
                value: customerStats?.total || 0,
                subtitle: `${customerStats?.newThisMonth || 0} new this month`,
                icon: 'bi-people-fill',
                gradient: 'from-primary-500 to-neutral-600',
                bgGradient: 'from-primary-50 to-neutral-50',
                iconBg: 'bg-primary-100',
                iconColor: 'text-primary-600',
                link: '/customers',
                action: 'View Customers'
              },
              {
                title: 'Suppliers',
                value: safeStats?.suppliers?.total || 0,
                subtitle: `${safeStats?.suppliers?.active || 0} active`,
                icon: 'bi-truck',
                gradient: 'from-orange-500 to-red-600',
                bgGradient: 'from-orange-50 to-red-50',
                iconBg: 'bg-orange-100',
                iconColor: 'text-orange-600',
                link: '/suppliers',
                action: 'View Suppliers'
              }
            ].map((card, index) => (
              <a
                key={card.title}
                href={card.link}
                className={`group relative bg-gradient-to-br ${card.bgGradient} rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 border border-white/50 backdrop-blur-sm cursor-pointer block active:scale-100 active:translate-y-0`}
                title={`Click to ${card.action}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-600 mb-2">{card.title}</p>
                    <p className="text-3xl font-bold text-slate-900 mb-1 font-mono-numbers group-hover:scale-110 transition-transform duration-300">{card.value}</p>
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                      <i className="bi bi-trending-up text-green-500 group-hover:animate-bounce"></i>
                      <span className="font-mono-numbers">{card.subtitle}</span>
                    </p>
                    <div className="mt-2 flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-600 font-medium">Live</span>
                    </div>
                  </div>
                  <div className={`w-14 h-14 ${card.iconBg} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <i className={`${card.icon} text-2xl ${card.iconColor}`}></i>
                  </div>
                </div>
                
                {/* Mini Chart */}
                <div className="mt-4">
                  <svg viewBox="0 0 100 20" className="w-full h-4 opacity-60">
                    <defs>
                      <linearGradient id={`chart-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="currentColor" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="currentColor" stopOpacity="0.2" />
                      </linearGradient>
                    </defs>
                    <polyline
                      fill="none"
                      stroke={`url(#chart-${index})`}
                      strokeWidth="2"
                      points="0,15 25,10 50,12 75,8 100,5"
                      className="text-slate-400"
                    />
                  </svg>
                </div>

                {/* Hover Overlay with Action Button */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl flex items-center justify-center">
                  <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      {card.action}
                      <i className="bi bi-arrow-right"></i>
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-600 rounded-xl flex items-center justify-center">
                  <i className="bi bi-lightning-charge-fill text-white text-lg"></i>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Quick Actions</h2>
                  <p className="text-sm text-slate-600">Common pharmacy tasks</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  label: 'Add Medicine',
                  href: '/medicines/create',
                  icon: 'bi-plus-circle-fill',
                  gradient: 'from-emerald-500 to-teal-600',
                  description: 'Add new medicine to inventory'
                },
                {
                  label: 'Process Sale',
                  href: '/sales/create',
                  icon: 'bi-cart-plus-fill',
                  gradient: 'from-accent-500 to-primary-600',
                  description: 'Create new sale transaction'
                },
                {
                  label: 'Add Customer',
                  href: '/customers/create',
                  icon: 'bi-person-plus-fill',
                  gradient: 'from-primary-500 to-neutral-600',
                  description: 'Register new customer'
                },
                {
                  label: 'Add Supplier',
                  href: '/suppliers/create',
                  icon: 'bi-building-add',
                  gradient: 'from-orange-500 to-red-600',
                  description: 'Add new supplier'
                }
              ].map((action) => (
                <a
                  key={action.label}
                  href={action.href}
                  className={`group relative bg-gradient-to-r ${action.gradient} rounded-xl p-4 text-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 overflow-hidden active:scale-100 active:translate-y-0`}
                >
                  <div className="relative z-10 flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <i className={`${action.icon} text-xl`}></i>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{action.label}</h3>
                      <p className="text-sm text-white/80">{action.description}</p>
                    </div>
                  </div>
                  
                  {/* Hover Effect with Shimmer */}
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                  </div>
                  
                  {/* Arrow Icon with Bounce */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0 group-hover:animate-bounce">
                    <i className="bi bi-arrow-right text-xl"></i>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Smart Automation Widget */}
          <div className="mb-6">
            <ErrorBoundary>
              <AutomationWidget />
            </ErrorBoundary>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sales Trends */}
            <div className="lg:col-span-2">
              <SalesTrendsCard period="daily" days={30} />
            </div>

            {/* Quick Insights */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-primary-600 rounded-xl flex items-center justify-center">
                  <i className="bi bi-lightbulb-fill text-white text-lg"></i>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Smart Insights</h3>
                  <p className="text-sm text-slate-600">AI-powered recommendations</p>
                </div>
              </div>

              <div className="space-y-4">
                {quickInsights && quickInsights.length > 0 ? (
                  quickInsights.slice(0, 4).map((insight, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-xl border-l-4 ${
                        insight.type === 'success' ? 'bg-green-50 border-green-400' :
                        insight.type === 'warning' ? 'bg-yellow-50 border-yellow-400' :
                        insight.type === 'danger' ? 'bg-red-50 border-red-400' :
                        'bg-blue-50 border-blue-400'
                      } hover:shadow-md transition-shadow duration-200`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          insight.type === 'success' ? 'bg-green-100' :
                          insight.type === 'warning' ? 'bg-yellow-100' :
                          insight.type === 'danger' ? 'bg-red-100' :
                          'bg-blue-100'
                        }`}>
                          <i className={`bi bi-${insight.icon} text-sm ${
                            insight.type === 'success' ? 'text-green-600' :
                            insight.type === 'warning' ? 'text-yellow-600' :
                            insight.type === 'danger' ? 'text-red-600' :
                            'text-blue-600'
                          }`}></i>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-900">{insight.title}</p>
                          <p className="text-sm text-slate-600 mt-1">{insight.message}</p>
                          {insight.action && (
                            <button className="text-sm text-accent-600 hover:text-accent-800 font-medium mt-2 hover:underline">
                              {insight.action} →
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="bi bi-check-circle-fill text-2xl text-green-600"></i>
                    </div>
                    <p className="text-sm text-slate-600 font-medium">All systems running smoothly!</p>
                    <p className="text-xs text-slate-500 mt-1">No alerts or recommendations at this time.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Enhanced Activity Tracker */}
          <div className="lg:col-span-3">
            <ErrorBoundary>
              <EnhancedActivityTracker 
                initialActivities={recentActivities || []}
                autoRefresh={isAutoRefresh}
                refreshInterval={30000}
                showFilters={true}
                maxItems={20}
              />
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}