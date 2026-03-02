import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  BellIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CubeIcon,
  ShoppingCartIcon,
  CogIcon,
} from '@heroicons/react/24/outline';
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid';
import { usePolling } from '@/Hooks/useRealtime';
import { fetchWithCsrf } from '@/Utils/csrf';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [error, setError] = useState(null);
  const [isLive, setIsLive] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);
  const dropdownRef = useRef(null);
  const previousUnreadCount = useRef(0);
  const audioRef = useRef(null);

  // Fetch notifications with real-time monitoring and auto-cleanup
  const fetchNotifications = async (skipCleanup = false) => {
    try {
      setIsLive(true);
      
      // Auto-cleanup resolved notifications before fetching
      // This ensures notifications are removed when issues are fixed
      if (!skipCleanup) {
        try {
          // Use GET request to avoid CSRF issues
          const cleanupResponse = await fetch('/notifications/cleanup', {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
            credentials: 'same-origin',
          });
          
          if (cleanupResponse.ok) {
            console.debug('🧹 Notification cleanup completed');
          }
        } catch (error) {
          // Silently fail cleanup, continue with fetch
          console.debug('Cleanup request failed:', error.message);
        }
      }
      
      const response = await fetch('/api/notifications');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // Check if there are new notifications
      const newUnreadCount = data.unread_count || 0;
      if (newUnreadCount > previousUnreadCount.current) {
        setHasNewNotifications(true);
        // Play notification sound if enabled
        if (soundEnabled && audioRef.current) {
          audioRef.current.play().catch(() => {
            console.log('Could not play notification sound');
          });
        }
        
        // Show browser notification if permission granted
        if (Notification.permission === 'granted') {
          new Notification('MediTrack Notification', {
            body: `You have ${newUnreadCount} unread notifications`,
            icon: '/favicon.ico',
            badge: '/favicon.ico'
          });
        }
        
        // Clear the new notification indicator after 3 seconds
        setTimeout(() => setHasNewNotifications(false), 3000);
      }
      
      // Check if notifications were auto-removed (count decreased without user action)
      if (newUnreadCount < previousUnreadCount.current && !loading) {
        console.log('✅ Auto-cleanup: Resolved notifications removed', {
          previous: previousUnreadCount.current,
          current: newUnreadCount,
          removed: previousUnreadCount.current - newUnreadCount
        });
      }
      
      previousUnreadCount.current = newUnreadCount;
      
      // Set notifications from monitoring service
      setNotifications(data.notifications || []);
      setUnreadCount(newUnreadCount);
      setLastUpdate(new Date());
      
      console.log('Notifications fetched:', {
        total: data.notifications?.length || 0,
        unread: newUnreadCount,
        summary: data.summary,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setIsLive(false);
      // Set empty state instead of throwing
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  // Fetch unread count with priority breakdown
  const fetchUnreadCount = useCallback(async () => {
    try {
      setIsLive(true);
      const response = await fetch('/api/notifications/unread-count');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // Check if there are new notifications
      const newCount = data.count || 0;
      if (newCount > previousUnreadCount.current) {
        setHasNewNotifications(true);
        // Play notification sound if enabled
        if (soundEnabled && audioRef.current) {
          audioRef.current.play().catch(() => {
            console.log('Could not play notification sound');
          });
        }
        
        // Only fetch full notifications if the dropdown is open to avoid unnecessary requests
        if (isOpen) {
          fetchNotifications(true);
        }
        
        // Clear the new notification indicator after 3 seconds
        setTimeout(() => setHasNewNotifications(false), 3000);
      }
      previousUnreadCount.current = newCount;
      
      setUnreadCount(newCount);
      setLastUpdate(new Date());
      
      console.log('Unread count updated:', {
        total: newCount,
        critical: data.critical,
        high: data.high,
        medium: data.medium,
        low: data.low,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching unread count:', error);
      setIsLive(false);
      setUnreadCount(0);
    }
  }, []);

  // Mark notification as read
  const markAsRead = async notificationId => {
    setActionLoading(prev => ({ ...prev, [`read_${notificationId}`]: true }));
    try {
      const response = await fetchWithCsrf(`/notifications/${notificationId}/read`, {
        method: 'POST',
      });

      if (!response.ok) {
        if (response.status === 419) {
          throw new Error('Session expired. Please refresh the page.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Update local state
        setNotifications(
          notifications.map(notification =>
            notification.id === notificationId ? { ...notification, read: true } : notification
          )
        );

        if (unreadCount > 0) {
          setUnreadCount(unreadCount - 1);
        }
        
        // Show success feedback
        setError(null);
      } else {
        throw new Error(result.message || 'Failed to mark as read');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      if (error.message.includes('Session expired')) {
        setError('Session expired. Please refresh the page.');
      } else {
        setError('Failed to mark notification as read');
      }
    } finally {
      setActionLoading(prev => ({ ...prev, [`read_${notificationId}`]: false }));
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    setLoading(true);
    try {
      const response = await fetchWithCsrf('/notifications/mark-all-read', {
        method: 'POST',
      });

      if (!response.ok) {
        if (response.status === 419) {
          throw new Error('Session expired. Please refresh the page.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setNotifications(notifications.map(notification => ({ ...notification, read: true })));
        setUnreadCount(0);
        setError(null);
        
        // Show success message briefly
        setTimeout(() => {
          fetchNotifications(); // Refresh to get latest state
        }, 500);
      } else {
        throw new Error(result.message || 'Failed to mark all as read');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      if (error.message.includes('Session expired')) {
        setError('Session expired. Please refresh the page.');
      } else {
        setError('Failed to mark all notifications as read');
      }
    } finally {
      setLoading(false);
    }
  };

  // Dismiss notification
  const dismissNotification = async notificationId => {
    setActionLoading(prev => ({ ...prev, [`dismiss_${notificationId}`]: true }));
    try {
      const response = await fetchWithCsrf(`/notifications/${notificationId}/dismiss`, {
        method: 'POST',
      });

      if (!response.ok) {
        if (response.status === 419) {
          throw new Error('Session expired. Please refresh the page.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Update local state with animation
        const notification = notifications.find(n => n.id === notificationId);
        
        // Remove from list
        setNotifications(notifications.filter(notification => notification.id !== notificationId));

        // Update unread count if it was unread
        if (notification && !notification.read) {
          setUnreadCount(Math.max(0, unreadCount - 1));
        }
        
        setError(null);
        console.log('Notification dismissed successfully');
      } else {
        throw new Error(result.message || 'Failed to dismiss notification');
      }
    } catch (error) {
      console.error('Error dismissing notification:', error);
      if (error.message.includes('Session expired')) {
        setError('Session expired. Please refresh the page.');
      } else {
        setError('Failed to dismiss notification');
      }
    } finally {
      setActionLoading(prev => ({ ...prev, [`dismiss_${notificationId}`]: false }));
    }
  };

  // Get notification icon based on category
  const getNotificationIcon = (category, customIcon) => {
    // Use custom icon if provided
    if (customIcon) {
      return <span className="text-2xl">{customIcon}</span>;
    }

    // Map categories to icons
    const iconMap = {
      low_stock: CubeIcon,
      out_of_stock: XMarkIcon,
      critical_stock: ExclamationTriangleIcon,
      medicine_expiry: ClockIcon,
      expired_medicine: XMarkIcon,
      pending_purchase: ShoppingCartIcon,
      system_alert: CogIcon,
    };

    const IconComponent = iconMap[category] || BellIcon;
    return <IconComponent className="h-5 w-5" />;
  };

  // Get priority color with gradients
  const getPriorityColor = priority => {
    const colors = {
      low: 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg',
      medium: 'bg-gradient-to-br from-yellow-500 to-yellow-600 text-white shadow-lg',
      high: 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg',
      critical: 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg',
    };
    return colors[priority] || colors.medium;
  };

  // Get priority border color
  const getPriorityBorder = priority => {
    const borders = {
      low: 'border-green-200 hover:border-green-300 bg-green-50/50',
      medium: 'border-yellow-200 hover:border-yellow-300 bg-yellow-50/50',
      high: 'border-orange-200 hover:border-orange-300 bg-orange-50/50',
      critical: 'border-red-200 hover:border-red-300 bg-red-50/50',
    };
    return borders[priority] || borders.medium;
  };

  // Filter notifications based on current filters
  const filteredNotifications = notifications.filter(notification => {
    // Priority filter
    if (filterPriority !== 'all' && notification.priority !== filterPriority) {
      return false;
    }
    
    // Category filter
    if (filterCategory !== 'all' && notification.category !== filterCategory) {
      return false;
    }
    
    // Unread filter
    if (showOnlyUnread && notification.read) {
      return false;
    }
    
    return true;
  });

  // Request notification permission on mount
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    // Load sound preference from localStorage
    const savedSoundPref = localStorage.getItem('notification_sound_enabled');
    if (savedSoundPref !== null) {
      setSoundEnabled(JSON.parse(savedSoundPref));
    }
  }, []);

  // Save sound preference to localStorage
  useEffect(() => {
    localStorage.setItem('notification_sound_enabled', JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Alt + N to toggle notifications
      if (event.altKey && event.key === 'n') {
        event.preventDefault();
        setIsOpen(!isOpen);
        if (!isOpen && notifications.length === 0) {
          fetchNotifications(true);
        }
      }
      
      // Alt + M to mark all as read (when dropdown is open)
      if (event.altKey && event.key === 'm' && isOpen && unreadCount > 0) {
        event.preventDefault();
        markAllAsRead();
      }
      
      // Escape to close dropdown
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, unreadCount, notifications.length]);

  // Toggle sound notifications
  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = event => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    // Handle CSRF failures
    const handleCsrfFailure = (event) => {
      setError(event.detail.message);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('csrf-failure', handleCsrfFailure);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('csrf-failure', handleCsrfFailure);
    };
  }, []);
  useEffect(() => {
    const handleClickOutside = event => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    // Handle CSRF failures
    const handleCsrfFailure = (event) => {
      setError(event.detail.message);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('csrf-failure', handleCsrfFailure);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('csrf-failure', handleCsrfFailure);
    };
  }, []);

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    // Mark as read if not already read
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    
    // Navigate to the route if available
    if (notification.route) {
      // Check if it's an external URL or internal route
      if (notification.route.startsWith('http')) {
        window.open(notification.route, '_blank');
      } else {
        // Use Inertia router if available, otherwise fallback to window.location
        if (window.route && window.route.current) {
          window.location.href = notification.route;
        } else {
          window.location.href = notification.route;
        }
      }
    }
    
    // Close dropdown after navigation
    setIsOpen(false);
  };

  // Handle action button click
  const handleActionClick = async (e, notification) => {
    e.stopPropagation();
    
    // Mark as read first
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    
    // Navigate to action route
    if (notification.route) {
      handleNotificationClick(notification);
    }
  };

  // Fetch notifications on mount - only fetch count initially for better performance
  useEffect(() => {
    fetchUnreadCount(); // Start with just the count
    // Initialize previous count
    previousUnreadCount.current = 0;
  }, []);

  // Poll unread count using reusable hook - every 10 seconds for better responsiveness
  usePolling(fetchUnreadCount, 10000, true);
  
  // Poll full notifications every 30 seconds to keep the list fresh
  usePolling(() => fetchNotifications(true), 30000, true);

  // Format time
  const formatTime = dateString => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Enhanced Notification Bell Button */}
      <button
        onClick={() => {
          const newIsOpen = !isOpen;
          setIsOpen(newIsOpen);
          // Fetch fresh notifications when opening the dropdown
          if (newIsOpen && notifications.length === 0) {
            fetchNotifications(true);
          }
        }}
        className="relative p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gradient-to-br hover:from-accent-50 hover:to-primary-50 rounded-xl transition-all duration-200 hover:scale-110 group"
        title={`${unreadCount} unread notifications - Updates every 10s`}
      >
        {unreadCount > 0 ? (
          <>
            <BellSolidIcon className={`h-6 w-6 text-blue-600 ${hasNewNotifications ? 'animate-bounce' : 'animate-pulse'}`} />
            {hasNewNotifications && (
              <span className="absolute inset-0 rounded-xl bg-blue-500/30 animate-ping"></span>
            )}
          </>
        ) : (
          <BellIcon className="h-6 w-6 group-hover:rotate-12 transition-transform duration-200" />
        )}

        {/* Enhanced Unread Count Badge */}
        {unreadCount > 0 && (
          <span className={`absolute -top-1 -right-1 h-6 w-6 bg-gradient-to-br from-red-500 to-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg border-2 border-white ${hasNewNotifications ? 'animate-bounce' : ''}`}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        
        {/* Live Indicator */}
        {isLive && (
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white animate-pulse" title="Live updates active"></span>
        )}
      </button>

      {/* Enhanced Notifications Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-[420px] bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 backdrop-blur-xl rounded-2xl shadow-2xl border-2 border-white/50 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border-b border-red-200">
              <div className="flex items-center gap-2 text-red-700 text-sm">
                <ExclamationTriangleIcon className="h-4 w-4" />
                <span>{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="ml-auto text-red-500 hover:text-red-700"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Enhanced Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-200/50 bg-gradient-to-r from-accent-500/10 to-primary-500/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-500 to-primary-600 flex items-center justify-center shadow-lg relative">
                <BellSolidIcon className="h-5 w-5 text-white" />
                {isLive && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse" title="Live"></span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black bg-gradient-to-r from-accent-600 to-primary-600 bg-clip-text text-transparent">
                    Notifications
                  </h3>
                  {isLive && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase tracking-wide">
                      Live
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <p className="text-xs text-gray-600">{unreadCount} unread • {filteredNotifications.length} shown</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Sound Toggle */}
              <button
                onClick={toggleSound}
                className={`p-2 rounded-lg transition-all ${
                  soundEnabled 
                    ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' 
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
                title={soundEnabled ? 'Sound notifications enabled' : 'Sound notifications disabled'}
              >
                <i className={`bi ${soundEnabled ? 'bi-volume-up' : 'bi-volume-mute'} text-sm`}></i>
              </button>
              
              {/* Refresh Button */}
              <button
                onClick={() => {
                  setError(null);
                  fetchNotifications();
                }}
                disabled={loading}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all disabled:opacity-50"
                title="Refresh notifications now"
              >
                {loading ? (
                  <i className="bi bi-arrow-repeat animate-spin text-sm"></i>
                ) : (
                  <i className="bi bi-arrow-clockwise text-sm"></i>
                )}
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  disabled={loading}
                  className="px-3 py-1.5 bg-blue-500 text-white text-xs font-bold rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-all duration-200 hover:scale-105 shadow-md"
                  title="Mark all as read (Alt+M)"
                >
                  {loading ? (
                    <i className="bi bi-arrow-repeat animate-spin"></i>
                  ) : (
                    <>
                      <i className="bi bi-check-all mr-1"></i>
                      Mark all read
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Enhanced Filters */}
          <div className="p-3 border-b border-gray-200/50 bg-gray-50/50">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {/* Priority Filter */}
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Priorities</option>
                  <option value="critical">🔴 Critical</option>
                  <option value="high">🟠 High</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="low">🟢 Low</option>
                </select>

                {/* Category Filter */}
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  <option value="low_stock">📦 Stock</option>
                  <option value="medicine_expiry">⏰ Expiry</option>
                  <option value="pending_purchase">🛒 Purchases</option>
                  <option value="system_alert">⚙️ System</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                {/* Unread Filter Toggle */}
                <button
                  onClick={() => setShowOnlyUnread(!showOnlyUnread)}
                  className={`px-2 py-1 text-xs font-medium rounded-lg transition-all ${
                    showOnlyUnread
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  title="Show only unread notifications"
                >
                  <i className="bi bi-eye mr-1"></i>
                  Unread Only
                </button>

                {/* Clear Filters */}
                {(filterPriority !== 'all' || filterCategory !== 'all' || showOnlyUnread) && (
                  <button
                    onClick={() => {
                      setFilterPriority('all');
                      setFilterCategory('all');
                      setShowOnlyUnread(false);
                    }}
                    className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-all"
                    title="Clear all filters"
                  >
                    <i className="bi bi-x-circle"></i>
                  </button>
                )}
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200/50">
              <div className="flex items-center gap-3 text-xs text-gray-600">
                <span>Total: {notifications.length}</span>
                <span>Filtered: {filteredNotifications.length}</span>
                <span>Unread: {unreadCount}</span>
              </div>
              <div className="text-xs text-gray-500">
                <kbd className="px-1 py-0.5 bg-gray-200 rounded text-[10px]">Alt+N</kbd> to toggle
              </div>
            </div>
          </div>

          {/* Enhanced Notifications List */}
          <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
            {filteredNotifications.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-4">
                  <BellIcon className="h-10 w-10 text-gray-400" />
                </div>
                {notifications.length === 0 ? (
                  <>
                    <p className="text-gray-600 font-medium text-lg">No notifications yet</p>
                    <p className="text-gray-500 text-sm mt-1">You're all caught up!</p>
                  </>
                ) : (
                  <>
                    <p className="text-gray-600 font-medium text-lg">No matching notifications</p>
                    <p className="text-gray-500 text-sm mt-1">Try adjusting your filters</p>
                  </>
                )}
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {filteredNotifications.map(notification => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`group relative p-4 rounded-xl border-2 transition-all duration-200 hover:scale-[1.02] cursor-pointer ${
                      !notification.read 
                        ? `${getPriorityBorder(notification.priority)} shadow-md` 
                        : 'bg-white/80 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {/* Unread Indicator */}
                    {!notification.read && (
                      <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></div>
                    )}

                    <div className="flex items-start gap-3">
                      {/* Enhanced Icon with Custom Emoji */}
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ${getPriorityColor(
                          notification.priority
                        )}`}
                      >
                        {getNotificationIcon(notification.category, notification.customIcon)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="text-sm font-bold text-gray-900">
                              {String(notification.title || '')}
                            </h4>
                            {(notification.priority === 'high' || notification.priority === 'critical') && (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold mt-1 ${
                                notification.priority === 'critical'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-orange-100 text-orange-700'
                              }`}>
                                <ExclamationTriangleIcon className="h-3 w-3" />
                                {notification.priority.toUpperCase()}
                              </span>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            {!notification.read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                disabled={actionLoading[`read_${notification.id}`]}
                                className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Mark as read"
                              >
                                {actionLoading[`read_${notification.id}`] ? (
                                  <i className="bi bi-arrow-repeat animate-spin text-xs"></i>
                                ) : (
                                  <CheckIcon className="h-4 w-4" />
                                )}
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                dismissNotification(notification.id);
                              }}
                              disabled={actionLoading[`dismiss_${notification.id}`]}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Dismiss"
                            >
                              {actionLoading[`dismiss_${notification.id}`] ? (
                                <i className="bi bi-arrow-repeat animate-spin text-xs"></i>
                              ) : (
                                <XMarkIcon className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Message */}
                        <p className="text-sm text-gray-700 font-medium leading-relaxed mb-1">
                          {String(notification.message || '')}
                        </p>
                        
                        {/* Description */}
                        {notification.description && (
                          <p className="text-xs text-gray-600 leading-relaxed mb-2">
                            {String(notification.description)}
                          </p>
                        )}

                        {/* Details */}
                        {notification.details && (
                          <p className="text-xs text-gray-500 leading-relaxed mb-2 italic">
                            {String(notification.details)}
                          </p>
                        )}

                        {/* Action Button */}
                        {notification.actionText && (
                          <button
                            onClick={(e) => handleActionClick(e, notification)}
                            disabled={actionLoading[`read_${notification.id}`]}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 hover:scale-105 mt-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                              notification.priority === 'critical'
                                ? 'bg-red-500 text-white hover:bg-red-600'
                                : notification.priority === 'high'
                                ? 'bg-orange-500 text-white hover:bg-orange-600'
                                : 'bg-blue-500 text-white hover:bg-blue-600'
                            }`}
                          >
                            {actionLoading[`read_${notification.id}`] ? (
                              <i className="bi bi-arrow-repeat animate-spin"></i>
                            ) : (
                              <i className="bi bi-arrow-right-circle"></i>
                            )}
                            {String(notification.actionText || 'View')}
                          </button>
                        )}
                        
                        {/* Time */}
                        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-200/50">
                          <i className="bi bi-clock text-gray-400 text-xs"></i>
                          <p className="text-xs text-gray-500 font-medium">
                            {formatTime(notification.time)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Enhanced Footer */}
          <div className="p-4 border-t border-gray-200/50 bg-gradient-to-r from-accent-500/5 to-primary-500/5">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  // Navigate to notifications page (you can create this route)
                  window.location.href = '/notifications';
                }}
                className="py-2.5 px-4 bg-gradient-to-r from-accent-500 to-primary-600 text-white font-bold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 text-sm"
              >
                <i className="bi bi-list-ul mr-1"></i>
                View All
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  // Navigate to notification preferences
                  window.location.href = '/notifications/preferences';
                }}
                className="py-2.5 px-4 bg-white text-gray-700 font-bold rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:shadow-md hover:scale-105 transition-all duration-200 text-sm"
              >
                <i className="bi bi-gear mr-1"></i>
                Settings
              </button>
            </div>
            
            {/* Quick Stats with Real-time Info */}
            <div className="mt-3 pt-3 border-t border-gray-200/50">
              <div className="flex justify-between items-center text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  {isLive ? (
                    <>
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                      <span className="font-medium text-green-600">Live</span>
                    </>
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                      <span className="font-medium text-gray-500">Offline</span>
                    </>
                  )}
                </div>
                {notifications.length > 0 && (
                  <>
                    <span>Total: {notifications.length}</span>
                    <span>Filtered: {filteredNotifications.length}</span>
                    <span>Unread: {unreadCount}</span>
                  </>
                )}
                <span title={lastUpdate.toLocaleString()}>
                  Updated: {lastUpdate.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
              <div className="mt-1 text-[10px] text-gray-500 text-center">
                Auto-refreshing every 10 seconds
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Hidden audio element for notification sounds */}
      <audio
        ref={audioRef}
        preload="auto"
        style={{ display: 'none' }}
      >
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT" type="audio/wav" />
      </audio>
    </div>
  );
}
