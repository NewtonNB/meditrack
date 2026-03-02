import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
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

export default function NotificationsIndex() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  // Mark as read
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
        setNotifications(notifications.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        ));
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  // Dismiss notification
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
        setNotifications(notifications.filter(n => n.id !== notificationId));
      }
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  // Get notification icon
  const getNotificationIcon = (category) => {
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
    return <IconComponent className="h-6 w-6" />;
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-green-100 text-green-800 border-green-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      critical: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[priority] || colors.medium;
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread' && notification.read) return false;
    if (filter === 'read' && !notification.read) return false;
    if (priorityFilter !== 'all' && notification.priority !== priorityFilter) return false;
    return true;
  });

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <AuthenticatedLayout
      header={
        <h2 className="text-xl font-semibold leading-tight text-gray-800">
          Notifications
        </h2>
      }
    >
      <Head title="Notifications" />

      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {/* Header */}
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                  <p className="text-gray-600 mt-1">
                    Manage your pharmacy notifications and alerts
                  </p>
                </div>
                <button
                  onClick={fetchNotifications}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? (
                    <i className="bi bi-arrow-repeat animate-spin mr-2"></i>
                  ) : (
                    <i className="bi bi-arrow-clockwise mr-2"></i>
                  )}
                  Refresh
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="p-6">
              <div className="flex flex-wrap gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status Filter
                  </label>
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="all">All Notifications</option>
                    <option value="unread">Unread Only</option>
                    <option value="read">Read Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority Filter
                  </label>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="all">All Priorities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6">
              {loading ? (
                <div className="text-center py-12">
                  <i className="bi bi-arrow-repeat animate-spin text-4xl text-gray-400 mb-4"></i>
                  <p className="text-gray-600">Loading notifications...</p>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-12">
                  <BellIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">No notifications found</p>
                  <p className="text-gray-500">You're all caught up!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-6 rounded-lg border-2 transition-all ${
                        !notification.read 
                          ? 'bg-blue-50 border-blue-200' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className={`p-3 rounded-lg ${getPriorityColor(notification.priority)}`}>
                          {getNotificationIcon(notification.category)}
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {String(notification?.title || 'Notification')}
                              </h3>
                              <p className="text-gray-700 mt-1">
                                {String(notification?.message || 'No message')}
                              </p>
                              {notification.description && (
                                <p className="text-gray-600 text-sm mt-2">
                                  {String(notification.description)}
                                </p>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 ml-4">
                              {!notification.read && (
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                  title="Mark as read"
                                >
                                  <CheckIcon className="h-5 w-5" />
                                </button>
                              )}
                              <button
                                onClick={() => dismissNotification(notification.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                title="Dismiss"
                              >
                                <XMarkIcon className="h-5 w-5" />
                              </button>
                            </div>
                          </div>

                          {/* Priority Badge */}
                          <div className="flex items-center gap-2 mt-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                              {String(notification?.priority || 'medium').toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(notification?.time || Date.now()).toLocaleString()}
                            </span>
                          </div>

                          {/* Action Button */}
                          {notification.actionText && notification.route && (
                            <button
                              onClick={() => window.location.href = notification.route}
                              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                            >
                              {String(notification.actionText)}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}