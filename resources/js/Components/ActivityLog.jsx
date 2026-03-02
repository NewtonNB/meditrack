import React, { useState } from 'react';
import { format } from 'date-fns';
import { safeRender, safeRenderEvent } from '@/Utils/safeRender';

/**
 * Activity Log Component
 *
 * Displays audit trail activities with filtering and formatting
 */
const ActivityLog = ({
  activities = [],
  showFilters = true,
  showUser = true,
  showSubject = true,
  maxHeight = '400px',
  emptyMessage = 'No activities found',
}) => {
  const [filter, setFilter] = useState('');
  const [eventFilter, setEventFilter] = useState('');

  // Filter activities based on search and event type
  const filteredActivities = activities.filter(activity => {
    const matchesSearch =
      !filter ||
      activity.description?.toLowerCase().includes(filter.toLowerCase()) ||
      activity.user?.name?.toLowerCase().includes(filter.toLowerCase()) ||
      activity.event?.toLowerCase().includes(filter.toLowerCase());

    const matchesEvent = !eventFilter || activity.event === eventFilter;

    return matchesSearch && matchesEvent;
  });

  // Get unique event types for filter dropdown
  const eventTypes = [...new Set(activities.map(a => String(a.event || '')).filter(Boolean))].sort();

  // Get activity icon based on event type
  const getActivityIcon = event => {
    const iconMap = {
      created: { icon: 'plus-circle', color: 'text-green-500' },
      updated: { icon: 'pencil-square', color: 'text-blue-500' },
      deleted: { icon: 'trash', color: 'text-red-500' },
      login: { icon: 'box-arrow-in-right', color: 'text-green-600' },
      logout: { icon: 'box-arrow-right', color: 'text-gray-500' },
      failed_login: { icon: 'shield-x', color: 'text-red-600' },
      role_assigned: { icon: 'person-badge', color: 'text-purple-500' },
      role_removed: { icon: 'person-dash', color: 'text-orange-500' },
      password_reset: { icon: 'key', color: 'text-yellow-600' },
      medicine_created: { icon: 'capsule', color: 'text-green-500' },
      sale_processed: { icon: 'cash-coin', color: 'text-blue-600' },
      customer_created: { icon: 'person-plus', color: 'text-indigo-500' },
      supplier_created: { icon: 'truck', color: 'text-purple-600' },
      stock_adjusted: { icon: 'box-seam', color: 'text-orange-500' },
      audit_export: { icon: 'download', color: 'text-gray-600' },
      unauthorized_access_attempt: { icon: 'shield-exclamation', color: 'text-red-700' },
    };

    return iconMap[event] || { icon: 'circle', color: 'text-gray-400' };
  };

  // Format activity description with highlighting
  const formatDescription = activity => {
    if (activity.formatted_description) {
      return String(activity.formatted_description);
    }

    return String(activity.description || `${activity.event} event`);
  };

  // Get relative time
  const getRelativeTime = timestamp => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return format(date, 'MMM d, yyyy');
  };

  // Render changes if available
  const renderChanges = activity => {
    if (!activity.changes || Object.keys(activity.changes).length === 0) {
      return null;
    }

    return (
      <div className="mt-2 text-xs">
        <details className="group">
          <summary className="cursor-pointer text-gray-500 hover:text-gray-700 select-none">
            <span className="group-open:hidden">Show changes</span>
            <span className="hidden group-open:inline">Hide changes</span>
          </summary>
          <div className="mt-1 pl-4 border-l-2 border-gray-200">
            {Object.entries(activity.changes).map(([field, change]) => (
              <div key={field} className="mb-1">
                <span className="font-medium text-gray-600">{field}:</span>
                <div className="flex items-center space-x-2 text-xs">
                  <span className="px-1 py-0.5 bg-red-100 text-red-700 rounded">
                    {String(change.old || 'null')}
                  </span>
                  <i className="bi bi-arrow-right text-gray-400"></i>
                  <span className="px-1 py-0.5 bg-green-100 text-green-700 rounded">
                    {String(change.new || 'null')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </details>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header with filters */}
      {showFilters && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search activities..."
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="sm:w-48">
              <select
                value={eventFilter}
                onChange={e => setEventFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Events</option>
                {eventTypes.map(event => {
                  const safeEvent = safeRenderEvent(event);
                  return (
                    <option key={safeEvent} value={safeEvent}>
                      {safeEvent.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Activity list */}
      <div className="overflow-y-auto" style={{ maxHeight }}>
        {filteredActivities.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <i className="bi bi-clock-history text-3xl mb-2 block"></i>
            <p>{emptyMessage}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredActivities.map((activity, index) => {
              const { icon, color } = getActivityIcon(activity.event);

              return (
                <div key={activity.id || index} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start space-x-3">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <i className={`bi bi-${icon} ${color} text-sm`}></i>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Description */}
                      <p className="text-sm text-gray-900">{formatDescription(activity)}</p>

                      {/* Meta information */}
                      <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                        {/* User */}
                        {showUser && activity.user && (
                          <span className="flex items-center">
                            <i className="bi bi-person mr-1"></i>
                            {String(activity.user.name || 'Unknown')}
                          </span>
                        )}

                        {/* Subject */}
                        {showSubject && activity.subject_type && (
                          <span className="flex items-center">
                            <i className="bi bi-tag mr-1"></i>
                            {activity.subject_type.split('\\').pop()} #{activity.subject_id}
                          </span>
                        )}

                        {/* IP Address */}
                        {activity.ip_address && (
                          <span className="flex items-center">
                            <i className="bi bi-geo-alt mr-1"></i>
                            {activity.ip_address}
                          </span>
                        )}

                        {/* Timestamp */}
                        <span className="flex items-center">
                          <i className="bi bi-clock mr-1"></i>
                          <time
                            dateTime={activity.created_at}
                            title={format(new Date(activity.created_at), 'PPpp')}
                          >
                            {getRelativeTime(activity.created_at)}
                          </time>
                        </span>
                      </div>

                      {/* Changes */}
                      {renderChanges(activity)}

                      {/* Properties */}
                      {activity.properties && Object.keys(activity.properties).length > 0 && (
                        <div className="mt-2">
                          <details className="group">
                            <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700 select-none">
                              <span className="group-open:hidden">Show details</span>
                              <span className="hidden group-open:inline">Hide details</span>
                            </summary>
                            <div className="mt-1 text-xs text-gray-600 bg-gray-50 rounded p-2">
                              <pre className="whitespace-pre-wrap font-mono text-xs">
                                {(() => {
                                  try {
                                    return JSON.stringify(activity.properties, null, 2);
                                  } catch (error) {
                                    return 'Unable to display properties';
                                  }
                                })()}
                              </pre>
                            </div>
                          </details>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer with count */}
      {filteredActivities.length > 0 && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
          Showing {filteredActivities.length} of {activities.length} activities
        </div>
      )}
    </div>
  );
};

export default ActivityLog;
