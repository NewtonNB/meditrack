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

      <div className="min-h-screen bg-slate-50 relative">        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Welcome Header */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
                  <i className="bi bi-house-heart-fill text-2xl text-white"></i>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">
                    Welcome Back!
                  </h1>
                  <p className="text-sm text-slate-600 mt-1">
                    Here's what's happening at your pharmacy today
                  </p>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 text-green-700 rounded-md">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs font-semibold">All Systems Online</span>
                    </div>
                    <div className="px-3 py-1 bg-slate-50 border border-slate-200 text-slate-600 rounded-md">
                      <span className="text-xs font-mono">Updated: {lastUpdated.toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleManualRefresh}
                  className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors"
                  title="Refresh Dashboard"
                >
                  <i className="bi bi-arrow-clockwise text-lg"></i>
                </button>
                
                <button
                  onClick={() => setIsAutoRefresh(!isAutoRefresh)}
                  className={`p-2.5 border rounded-lg transition-colors ${
                    isAutoRefresh 
                      ? 'bg-green-50 border-green-200 hover:bg-green-100 text-green-700' 
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                  title={isAutoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
                >
                  <i className={`bi ${isAutoRefresh ? 'bi-play-circle-fill' : 'bi-pause-circle-fill'} text-lg`}></i>
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
                className="block bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                title={`Click to ${card.action}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-500 mb-1">{card.title}</p>
                    <p className="text-2xl font-bold text-slate-800 mb-1 font-mono-numbers">{card.value}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <span className="font-mono-numbers">{card.subtitle}</span>
                    </p>
                  </div>
                  <div className={`w-12 h-12 ${card.iconBg} rounded-lg flex items-center justify-center`}>
                    <i className={`${card.icon} text-xl ${card.iconColor}`}></i>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1">
                    {card.action}
                    <i className="bi bi-arrow-right"></i>
                  </span>
                </div>
              </a>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                  <i className="bi bi-lightning-charge-fill text-lg"></i>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Quick Actions</h2>
                  <p className="text-sm text-slate-500">Common pharmacy tasks</p>
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
                  className="flex items-center gap-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-slate-300 hover:shadow-md transition-all group"
                >
                  <div className="w-12 h-12 bg-slate-50 text-blue-600 rounded-lg flex items-center justify-center border border-slate-100 group-hover:bg-blue-50 transition-colors">
                    <i className={`${action.icon} text-xl`}></i>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm text-slate-800">{action.label}</h3>
                    <p className="text-xs text-slate-500">{action.description}</p>
                  </div>
                  <div className="text-slate-400 group-hover:text-blue-600 transition-colors">
                    <i className="bi bi-arrow-right"></i>
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
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex flex-col h-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                  <i className="bi bi-lightbulb-fill text-lg"></i>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Smart Insights</h3>
                  <p className="text-sm text-slate-500">System recommendations</p>
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