import React, { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import ActivityLog from '@/Components/ActivityLog';

/**
 * Security Dashboard Component
 *
 * Displays security events, suspicious activities, and monitoring data
 */
const SecurityDashboard = ({
  securityEvents = [],
  suspiciousActivities = [],
  realTimeUpdates = false,
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [alertsCount, setAlertsCount] = useState(0);
  const [recentEvents, setRecentEvents] = useState(securityEvents);

  // Update alerts count when suspicious activities change
  useEffect(() => {
    setAlertsCount(suspiciousActivities.length);
  }, [suspiciousActivities]);

  // Real-time updates (if enabled)
  useEffect(() => {
    if (!realTimeUpdates) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(route('audit.feed'));
        const data = await response.json();
        setRecentEvents(data.activities || []);
      } catch (error) {
        console.error('Failed to fetch real-time updates:', error);
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [realTimeUpdates]);

  // Get security metrics
  const getSecurityMetrics = () => {
    const now = new Date();
    const timeframes = {
      '1h': 1,
      '24h': 24,
      '7d': 24 * 7,
      '30d': 24 * 30,
    };

    const hoursBack = timeframes[selectedTimeframe] || 24;
    const cutoffTime = new Date(now.getTime() - hoursBack * 60 * 60 * 1000);

    const filteredEvents = recentEvents.filter(event => new Date(event.created_at) >= cutoffTime);

    const loginAttempts = filteredEvents.filter(e => e.event === 'login').length;
    const failedLogins = filteredEvents.filter(e => e.event === 'failed_login').length;
    const unauthorizedAccess = filteredEvents.filter(
      e => e.event === 'unauthorized_access_attempt'
    ).length;
    const roleChanges = filteredEvents.filter(e =>
      ['role_assigned', 'role_removed', 'roles_synced'].includes(e.event)
    ).length;

    return {
      loginAttempts,
      failedLogins,
      unauthorizedAccess,
      roleChanges,
      successRate:
        loginAttempts > 0
          ? (((loginAttempts - failedLogins) / loginAttempts) * 100).toFixed(1)
          : 100,
    };
  };

  const metrics = getSecurityMetrics();

  // Get alert severity color
  const getAlertSeverityColor = severity => {
    const colors = {
      high: 'bg-red-100 text-red-800 border-red-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return colors[severity] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Get metric trend icon
  const getTrendIcon = (current, previous) => {
    if (current > previous) return { icon: 'arrow-up', color: 'text-red-500' };
    if (current < previous) return { icon: 'arrow-down', color: 'text-green-500' };
    return { icon: 'dash', color: 'text-gray-500' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Security Dashboard</h2>
          <p className="text-gray-600">Monitor security events and threats</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Time frame selector */}
          <select
            value={selectedTimeframe}
            onChange={e => setSelectedTimeframe(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>

          {/* Real-time indicator */}
          {realTimeUpdates && (
            <div className="flex items-center text-sm text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
              Live
            </div>
          )}
        </div>
      </div>

      {/* Alert Banner */}
      {alertsCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <i className="bi bi-exclamation-triangle text-red-600 text-xl"></i>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">Security Alerts Detected</h3>
              <p className="text-sm text-red-700 mt-1">
                {alertsCount} suspicious {alertsCount === 1 ? 'activity' : 'activities'} detected.
                Review immediately.
              </p>
            </div>
            <div className="ml-3">
              <Link
                href={route('audit.security')}
                className="text-sm font-medium text-red-800 hover:text-red-900"
              >
                View Details →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Login Success Rate */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Login Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.successRate}%</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <i className="bi bi-shield-check text-green-600 text-xl"></i>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-500">{metrics.loginAttempts} total attempts</span>
          </div>
        </div>

        {/* Failed Logins */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Failed Logins</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.failedLogins}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <i className="bi bi-shield-x text-red-600 text-xl"></i>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className={metrics.failedLogins > 5 ? 'text-red-600' : 'text-gray-500'}>
              {metrics.failedLogins > 5 ? 'High activity detected' : 'Normal activity'}
            </span>
          </div>
        </div>

        {/* Unauthorized Access */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Unauthorized Access</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.unauthorizedAccess}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <i className="bi bi-shield-exclamation text-orange-600 text-xl"></i>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className={metrics.unauthorizedAccess > 0 ? 'text-orange-600' : 'text-gray-500'}>
              {metrics.unauthorizedAccess > 0 ? 'Requires attention' : 'No incidents'}
            </span>
          </div>
        </div>

        {/* Role Changes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Role Changes</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.roleChanges}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <i className="bi bi-person-badge text-purple-600 text-xl"></i>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-500">Administrative changes</span>
          </div>
        </div>
      </div>

      {/* Suspicious Activities */}
      {suspiciousActivities.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <i className="bi bi-exclamation-triangle text-red-500 mr-2"></i>
              Suspicious Activities
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {suspiciousActivities.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-4 bg-red-50 rounded-lg border border-red-200"
                >
                  <div className="flex-shrink-0">
                    <i className="bi bi-shield-exclamation text-red-600 text-lg"></i>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-red-900">
                        {activity.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </h4>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getAlertSeverityColor(activity.severity)}`}
                      >
                        {activity.severity}
                      </span>
                    </div>
                    <p className="text-sm text-red-800 mt-1">{activity.description}</p>
                    {activity.count && (
                      <p className="text-xs text-red-600 mt-2">Occurred {activity.count} times</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Security Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security Events Log */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <i className="bi bi-shield-check text-indigo-500 mr-2"></i>
              Recent Security Events
            </h3>
          </div>
          <ActivityLog
            activities={recentEvents.filter(event =>
              [
                'login',
                'logout',
                'failed_login',
                'role_assigned',
                'role_removed',
                'unauthorized_access_attempt',
              ].includes(event.event)
            )}
            showFilters={false}
            maxHeight="400px"
            emptyMessage="No security events in selected timeframe"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-6 space-y-4">
            <Link
              href={route('audit.index')}
              className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-shrink-0">
                <i className="bi bi-list-ul text-indigo-600 text-lg"></i>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">View Full Audit Log</p>
                <p className="text-xs text-gray-500">Complete activity history</p>
              </div>
            </Link>

            <Link
              href={route('users.management')}
              className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-shrink-0">
                <i className="bi bi-people text-purple-600 text-lg"></i>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Manage Users</p>
                <p className="text-xs text-gray-500">User accounts and permissions</p>
              </div>
            </Link>

            <Link
              href={route('audit.export')}
              className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-shrink-0">
                <i className="bi bi-download text-green-600 text-lg"></i>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Export Security Report</p>
                <p className="text-xs text-gray-500">Download audit data</p>
              </div>
            </Link>

            <Link
              href={route('audit.compliance')}
              className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-shrink-0">
                <i className="bi bi-shield-check text-blue-600 text-lg"></i>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Compliance Report</p>
                <p className="text-xs text-gray-500">Generate compliance documentation</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityDashboard;
