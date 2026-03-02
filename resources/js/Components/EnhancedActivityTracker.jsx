import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';

const EnhancedActivityTracker = ({ 
  initialActivities = [], 
  autoRefresh = true, 
  refreshInterval = 30000,
  showFilters = true,
  maxItems = 20 
}) => {
  const [activities, setActivities] = useState(Array.isArray(initialActivities) ? initialActivities : []);
  const [filteredActivities, setFilteredActivities] = useState(Array.isArray(initialActivities) ? initialActivities : []);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [hasError, setHasError] = useState(false);

  // Activity type filters
  const activityTypes = [
    { value: 'all', label: 'All Activities', icon: 'bi-list', color: 'text-slate-600' },
    { value: 'sale', label: 'Sales', icon: 'bi-receipt', color: 'text-green-600' },
    { value: 'purchase', label: 'Purchases', icon: 'bi-cart3', color: 'text-indigo-600' },
    { value: 'stock_movement', label: 'Stock Movements', icon: 'bi-arrow-left-right', color: 'text-cyan-600' },
    { value: 'medicine', label: 'Medicines', icon: 'bi-capsule', color: 'text-blue-600' },
    { value: 'customer', label: 'Customers', icon: 'bi-person-plus', color: 'text-purple-600' },
    { value: 'supplier', label: 'Suppliers', icon: 'bi-building', color: 'text-orange-600' },
    { value: 'alert', label: 'Alerts', icon: 'bi-exclamation-triangle', color: 'text-red-600' },
    { value: 'warning', label: 'Warnings', icon: 'bi-clock', color: 'text-yellow-600' },
  ];

  // Listen for new activity events
  useEffect(() => {
    try {
      const handleNewActivity = (event) => {
        try {
          const newActivity = event.detail;
          if (newActivity && typeof newActivity === 'object') {
            setActivities(prevActivities => [newActivity, ...prevActivities.slice(0, maxItems - 1)]);
            setLastUpdate(new Date());
            
            // Show a brief notification for new activities
            if (newActivity.priority === 'critical') {
              // Critical activity detected
            }
          }
        } catch (error) {
          // Error handling new activity
        }
      };

      // Listen for various activity events
      const activityEvents = [
        'newActivity',
        'saleCompleted', 
        'medicineAdded',
        'stockMovement',
        'purchaseCreated',
        'customerRegistered',
        'supplierAdded',
        'lowStockAlert',
        'expiryWarning'
      ];

      activityEvents.forEach(eventType => {
        window.addEventListener(eventType, handleNewActivity);
      });

      return () => {
        activityEvents.forEach(eventType => {
          window.removeEventListener(eventType, handleNewActivity);
        });
      };
    } catch (error) {
      setHasError(true);
    }
  }, [maxItems]);

  // Auto-refresh activities
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refreshActivities();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // Filter activities when filter or search changes
  useEffect(() => {
    let filtered = activities;

    // Apply type filter
    if (filter !== 'all') {
      filtered = filtered.filter(activity => activity.type === filter);
    }

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(activity => 
        activity.title?.toLowerCase().includes(search) ||
        activity.description?.toLowerCase().includes(search) ||
        activity.details?.toLowerCase().includes(search)
      );
    }

    setFilteredActivities(filtered.slice(0, maxItems));
  }, [activities, filter, searchTerm, maxItems]);

  // Refresh activities from server
  const refreshActivities = async () => {
    setIsLoading(true);
    try {
      // Use Inertia to reload only the activities data
      router.reload({ 
        only: ['recentActivities'],
        onSuccess: (page) => {
          if (page.props.recentActivities) {
            setActivities(page.props.recentActivities);
            setLastUpdate(new Date());
          }
        }
      });
    } catch (error) {
      // Failed to refresh activities
    } finally {
      setIsLoading(false);
    }
  };

  // Manual refresh
  const handleManualRefresh = () => {
    refreshActivities();
  };

  // Get activity icon and styling
  const getActivityStyle = (activity) => {
    const styles = {
      sale: { 
        icon: 'bi-receipt', 
        bgColor: 'bg-green-100', 
        textColor: 'text-green-700',
        borderColor: 'border-green-200'
      },
      purchase: { 
        icon: 'bi-cart3', 
        bgColor: 'bg-indigo-100', 
        textColor: 'text-indigo-700',
        borderColor: 'border-indigo-200'
      },
      stock_movement: { 
        icon: 'bi-arrow-left-right', 
        bgColor: 'bg-cyan-100', 
        textColor: 'text-cyan-700',
        borderColor: 'border-cyan-200'
      },
      medicine: { 
        icon: 'bi-capsule', 
        bgColor: 'bg-blue-100', 
        textColor: 'text-blue-700',
        borderColor: 'border-blue-200'
      },
      customer: { 
        icon: 'bi-person-plus', 
        bgColor: 'bg-purple-100', 
        textColor: 'text-purple-700',
        borderColor: 'border-purple-200'
      },
      supplier: { 
        icon: 'bi-building', 
        bgColor: 'bg-orange-100', 
        textColor: 'text-orange-700',
        borderColor: 'border-orange-200'
      },
      alert: { 
        icon: 'bi-exclamation-triangle', 
        bgColor: 'bg-red-100', 
        textColor: 'text-red-700',
        borderColor: 'border-red-200'
      },
      warning: { 
        icon: 'bi-clock', 
        bgColor: 'bg-yellow-100', 
        textColor: 'text-yellow-700',
        borderColor: 'border-yellow-200'
      },
    };

    return styles[activity.type] || {
      icon: 'bi-circle',
      bgColor: 'bg-slate-100',
      textColor: 'text-slate-700',
      borderColor: 'border-slate-200'
    };
  };

  // Handle activity click
  const handleActivityClick = (activity) => {
    if (activity.route) {
      // Use Inertia router for better navigation
      router.visit(activity.route);
    }
  };

  // Get relative time with more precision
  const getRelativeTime = (timeString) => {
    const now = new Date();
    const activityTime = new Date(timeString);
    const diffInSeconds = Math.floor((now - activityTime) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return activityTime.toLocaleDateString();
  };

  // Error fallback
  if (hasError) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="bi bi-exclamation-triangle text-2xl text-red-600"></i>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Activity Tracker Error</h3>
          <p className="text-slate-600 mb-4">Unable to load activity data. Please refresh the page.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50">
      {/* Header */}
      <div className="p-6 border-b border-slate-200/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <i className="bi bi-activity text-white text-lg"></i>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Activity Tracker</h3>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-green-600 font-medium">Live Tracking</span>
                </div>
                <span className="text-xs text-slate-500 font-mono-numbers">
                  Updated: {lastUpdate.toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleManualRefresh}
            disabled={isLoading}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all duration-200 disabled:opacity-50"
            title="Refresh Activities"
          >
            <i className={`bi bi-arrow-clockwise text-lg ${isLoading ? 'animate-spin' : ''}`}></i>
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="space-y-3">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="bi bi-search text-slate-400"></i>
              </div>
              <input
                type="text"
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50/50 hover:bg-white transition-colors duration-200"
              />
            </div>

            {/* Type filters */}
            <div className="flex flex-wrap gap-2">
              {activityTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setFilter(type.value)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    filter === type.value
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <i className={`${type.icon} ${type.color}`}></i>
                  {type.label}
                  {filter === type.value && (
                    <span className="ml-1 px-1.5 py-0.5 bg-blue-200 text-blue-800 rounded-full text-xs font-mono-numbers">
                      {filteredActivities.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Activities List */}
      <div className="max-h-96 overflow-y-auto custom-scrollbar">
        {filteredActivities.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="bi bi-activity text-2xl text-slate-400"></i>
            </div>
            <p className="text-slate-600 font-medium">
              {searchTerm || filter !== 'all' ? 'No matching activities found' : 'No recent activities'}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              {searchTerm || filter !== 'all' ? 'Try adjusting your filters' : 'Activities will appear here as they happen'}
            </p>
          </div>
        ) : (
          <div className="space-y-3 p-4">
            {filteredActivities.map((activity, index) => {
              const style = getActivityStyle(activity);
              
              return (
                <div
                  key={activity.id || index}
                  className={`group relative bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-slate-200/60 hover:border-slate-300/60 hover:shadow-lg transition-all duration-300 ${
                    activity.route ? 'cursor-pointer hover:scale-[1.01]' : ''
                  }`}
                  onClick={() => handleActivityClick(activity)}
                >
                  {/* Priority Indicator */}
                  {activity.priority === 'critical' && (
                    <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  )}
                  {activity.priority === 'high' && (
                    <div className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full"></div>
                  )}

                  <div className="flex items-start gap-4">
                    {/* Enhanced Icon */}
                    <div className={`relative w-12 h-12 rounded-xl ${style.bgColor} ${style.textColor} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 border ${style.borderColor} shadow-sm`}>
                      <i className={`${style.icon} text-lg`}></i>
                      {/* Activity type indicator */}
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${style.bgColor} rounded-full border-2 border-white flex items-center justify-center`}>
                        <i className={`${style.icon} text-xs ${style.textColor}`}></i>
                      </div>
                    </div>

                    {/* Enhanced Content */}
                    <div className="flex-1 min-w-0">
                      {/* Header Row */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-bold text-slate-900">
                              {activity.title}
                            </h4>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${style.bgColor} ${style.textColor} border ${style.borderColor}`}>
                              {activity.type}
                            </span>
                          </div>
                          <p className="text-sm text-slate-700 leading-relaxed">
                            {activity.description}
                          </p>
                        </div>
                        
                        {/* Amount Display */}
                        {activity.amount && (
                          <div className="ml-4 text-right">
                            <div className="text-lg font-bold text-green-600 font-mono-numbers">
                              ${activity.amount.toLocaleString()}
                            </div>
                            <div className="text-xs text-slate-500">Amount</div>
                          </div>
                        )}
                      </div>

                      {/* Details Row */}
                      {activity.details && (
                        <div className="mb-3 p-2 bg-slate-50/50 rounded-lg border border-slate-200/50">
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {activity.details}
                          </p>
                        </div>
                      )}

                      {/* Footer Row */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-500 font-mono-numbers flex items-center gap-1">
                            <i className="bi bi-clock text-slate-400"></i>
                            {getRelativeTime(activity.time)}
                          </span>
                          
                          {activity.metadata && activity.metadata.quantity && (
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <i className="bi bi-box text-slate-400"></i>
                              Qty: {activity.metadata.quantity}
                            </span>
                          )}
                        </div>
                        
                        {/* Action Indicator */}
                        {activity.route && (
                          <div className="flex items-center gap-1 text-xs text-slate-400 group-hover:text-slate-600 transition-colors duration-200">
                            <span>View Details</span>
                            <i className="bi bi-arrow-right"></i>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-accent-500/5 to-primary-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {filteredActivities.length > 0 && (
        <div className="p-4 bg-slate-50/50 border-t border-slate-200/50 rounded-b-2xl">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">
              Showing <span className="font-mono-numbers font-medium">{filteredActivities.length}</span> of{' '}
              <span className="font-mono-numbers font-medium">{activities.length}</span> activities
            </span>
            
            {activities.length > maxItems && (
              <button 
                onClick={() => router.visit('/dashboard')}
                className="text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors duration-200"
              >
                View All Activities →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedActivityTracker;