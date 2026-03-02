import React, { useState, useEffect } from 'react';
import { BellIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

const RealTimeNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch notifications on component mount
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
    
    // Set up polling for real-time updates
    const interval = setInterval(() => {
      fetchUnreadCount();
      if (isOpen) {
        fetchNotifications();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [isOpen]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/notifications', {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/notifications/unread-count', {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
        },
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, read_at: new Date().toISOString() }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/notifications/mark-all-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
        },
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, read_at: new Date().toISOString() }))
        );
        setUnreadCount(0);
        toast.success('All notifications marked as read');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const dismissNotification = async (notificationId) => {
    try {
      const response = await fetch(`/notifications/${notificationId}/dismiss`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
        },
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
        if (!notifications.find(n => n.id === notificationId)?.read_at) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      'low_stock': '📦',
      'expiry_warning': '⏰',
      'sale_completed': '💰',
      'new_customer': '👤',
      'system_alert': '⚠️',
      'success': '✅',
      'info': 'ℹ️',
      'warning': '⚠️',
      'error': '❌',
    };
    return icons[type] || '🔔';
  };

  const getNotificationColor = (type, priority = 'normal') => {
    if (priority === 'high') return 'border-l-red-500 bg-red-50';
    if (priority === 'medium') return 'border-l-yellow-500 bg-yellow-50';
    
    const colors = {
      'low_stock': 'border-l-orange-500 bg-orange-50',
      'expiry_warning': 'border-l-red-500 bg-red-50',
      'sale_completed': 'border-l-green-500 bg-green-50',
      'new_customer': 'border-l-blue-500 bg-blue-50',
      'system_alert': 'border-l-yellow-500 bg-yellow-50',
      'success': 'border-l-green-500 bg-green-50',
      'info': 'border-l-blue-500 bg-blue-50',
      'warning': 'border-l-yellow-500 bg-yellow-50',
      'error': 'border-l-red-500 bg-red-50',
    };
    return colors[type] || 'border-l-gray-500 bg-gray-50';
  };

  const formatTimeAgo = (dateString) => {
    try {
      if (!dateString) return 'Unknown time';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      const now = new Date();
      const diffInSeconds = Math.floor((now - date) / 1000);
      
      if (diffInSeconds < 60) return 'Just now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'Unknown time';
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full transition-colors"
      >
        <BellIcon className="h-6 w-6" />
        
        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full min-w-[1.25rem] h-5">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        
        {/* Pulse Animation for New Notifications */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex rounded-full h-3 w-3 bg-red-400 opacity-75 animate-ping"></span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            {unreadCount > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
                <span className="ml-2 text-gray-600">Loading notifications...</span>
              </div>
            ) : notifications.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors border-l-4 ${getNotificationColor(notification.type, notification.priority)} ${
                      !notification.read_at ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-lg flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className={`text-sm font-medium ${!notification.read_at ? 'text-gray-900' : 'text-gray-700'}`}>
                              {notification.title || 'Notification'}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message || 'No message'}
                            </p>
                            
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-xs text-gray-500">
                                {formatTimeAgo(notification.created_at || notification.time)}
                              </span>
                              
                              {notification.priority && notification.priority !== 'normal' && (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  notification.priority === 'high' ? 'bg-red-100 text-red-800' :
                                  notification.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {notification.priority} priority
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1 ml-2">
                            {!notification.read_at && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                                title="Mark as read"
                              >
                                <CheckIcon className="h-4 w-4" />
                              </button>
                            )}
                            
                            <button
                              onClick={() => dismissNotification(notification.id)}
                              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                              title="Dismiss"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BellIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No notifications</p>
                <p className="text-sm text-gray-400 mt-1">You're all caught up!</p>
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  window.location.href = '/notifications';
                  setIsOpen(false);
                }}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RealTimeNotifications;