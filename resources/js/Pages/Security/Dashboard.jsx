import React, { useState, useEffect, useMemo } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import 'bootstrap-icons/font/bootstrap-icons.css';

export default function SecurityDashboard({ 
  metrics = {}, 
  recentEvents = [], 
  suspiciousActivities = [],
  securityTrends = {},
  threatIntelligence = {}
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [activeTab, setActiveTab] = useState('overview');
  const [connectionStatus, setConnectionStatus] = useState('connected');

  // Auto-refresh with real-time updates
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setConnectionStatus('syncing');
      setLastUpdate(new Date());
      
      // Refresh data from server
      router.reload({ 
        only: ['metrics', 'recentEvents', 'suspiciousActivities', 'securityTrends'],
        onSuccess: () => setConnectionStatus('connected'),
        onError: () => setConnectionStatus('error')
      });
    }, 15000); // 15 second refresh

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Calculate security score
  const securityScore = useMemo(() => {
    let score = 100;
    
    // Deduct points for security issues
    if (metrics.failed_logins_24h > 5) score -= 20;
    if (metrics.critical_events_24h > 0) score -= 30;
    if (metrics.compliance_violations_30d > 0) score -= 15;
    if (suspiciousActivities.length > 0) score -= 10;
    
    return Math.max(score, 0);
  }, [metrics, suspiciousActivities]);

  // Get security level based on score
  const getSecurityLevel = (score) => {
    if (score >= 90) return { level: 'Excellent', color: 'green', icon: 'bi-shield-check' };
    if (score >= 70) return { level: 'Good', color: 'blue', icon: 'bi-shield' };
    if (score >= 50) return { level: 'Warning', color: 'orange', icon: 'bi-shield-exclamation' };
    return { level: 'Critical', color: 'red', icon: 'bi-shield-x' };
  };

  const securityLevel = getSecurityLevel(securityScore);

  const securityCards = [
    {
      title: 'Failed Logins (24h)',
      value: metrics.failed_logins_24h || 0,
      icon: 'bi-shield-x',
      color: metrics.failed_logins_24h > 5 ? 'red' : 'green',
      description: 'Authentication failures in last 24 hours'
    },
    {
      title: 'Unique IPs (24h)',
      value: metrics.unique_ips_24h || 0,
      icon: 'bi-globe',
      color: 'blue',
      description: 'Distinct IP addresses accessing system'
    },
    {
      title: 'Critical Events (24h)',
      value: metrics.critical_events_24h || 0,
      icon: 'bi-exclamation-triangle',
      color: metrics.critical_events_24h > 0 ? 'red' : 'green',
      description: 'High-severity security events'
    },
    {
      title: 'Compliance Issues (30d)',
      value: metrics.compliance_violations_30d || 0,
      icon: 'bi-exclamation-octagon',
      color: metrics.compliance_violations_30d > 0 ? 'orange' : 'green',
      description: 'Regulatory compliance violations'
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      red: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-700',
        icon: 'bg-red-500'
      },
      green: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-700',
        icon: 'bg-green-500'
      },
      blue: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-700',
        icon: 'bg-blue-500'
      },
      orange: {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-700',
        icon: 'bg-orange-500'
      }
    };
    return colors[color] || colors.blue;
  };

  return (
    <AuthenticatedLayout>
      <Head title="Security Dashboard - MediTrack" />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          
          {/* Enhanced Header with Security Score */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className={`bg-gradient-to-r px-8 py-6 ${
              securityLevel.color === 'green' ? 'from-green-600 to-emerald-700' :
              securityLevel.color === 'blue' ? 'from-blue-600 to-indigo-700' :
              securityLevel.color === 'orange' ? 'from-orange-600 to-red-600' :
              'from-red-600 to-pink-700'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <i className={`${securityLevel.icon} text-3xl text-white`}></i>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">Security Command Center</h1>
                    <p className="text-white/80 text-sm">Real-time threat monitoring and incident response</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  {/* Security Score */}
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white">{securityScore}</div>
                    <div className="text-white/80 text-sm">Security Score</div>
                    <div className="text-white/60 text-xs">{securityLevel.level}</div>
                  </div>
                  
                  {/* Connection Status */}
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                    connectionStatus === 'connected' ? 'bg-green-500' :
                    connectionStatus === 'syncing' ? 'bg-blue-500' :
                    'bg-red-500'
                  } text-white`}>
                    {connectionStatus === 'syncing' ? (
                      <div className="w-2 h-2 border border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    )}
                    <span className="text-sm font-medium">
                      {connectionStatus === 'connected' ? 'Live' :
                       connectionStatus === 'syncing' ? 'Syncing' : 'Error'}
                    </span>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-white font-semibold">Last Update</div>
                    <div className="text-white/80 text-sm">{lastUpdate.toLocaleTimeString()}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Controls */}
            <div className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Quick Actions */}
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/audit-logs?event=failed_login"
                    className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-all duration-200 hover:scale-105 flex items-center gap-2"
                  >
                    <i className="bi bi-shield-x"></i>
                    <span className="font-medium">Failed Logins</span>
                  </Link>
                  
                  <Link
                    href="/audit-logs?severity=critical"
                    className="px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg transition-all duration-200 hover:scale-105 flex items-center gap-2"
                  >
                    <i className="bi bi-exclamation-triangle"></i>
                    <span className="font-medium">Critical Events</span>
                  </Link>
                  
                  <Link
                    href="/compliance/dashboard"
                    className="px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-all duration-200 hover:scale-105 flex items-center gap-2"
                  >
                    <i className="bi bi-clipboard-check"></i>
                    <span className="font-medium">Compliance</span>
                  </Link>
                  
                  <Link
                    href="/audit-logs"
                    className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-all duration-200 hover:scale-105 flex items-center gap-2"
                  >
                    <i className="bi bi-list-ul"></i>
                    <span className="font-medium">All Logs</span>
                  </Link>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3">
                  {/* Time Range Selector */}
                  <select
                    value={selectedTimeRange}
                    onChange={(e) => setSelectedTimeRange(e.target.value)}
                    className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="1h">Last Hour</option>
                    <option value="24h">Last 24 Hours</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                  </select>

                  {/* Auto-refresh Toggle */}
                  <button
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    className={`px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 flex items-center gap-2 ${
                      autoRefresh 
                        ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <i className={`bi ${autoRefresh ? 'bi-pause-fill' : 'bi-play-fill'}`}></i>
                    <span className="font-medium">{autoRefresh ? 'Pause' : 'Resume'}</span>
                  </button>
                  
                  {/* Manual Refresh */}
                  <button
                    onClick={() => window.location.reload()}
                    disabled={isLoading}
                    className="px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg transition-all duration-200 hover:scale-105 flex items-center gap-2 disabled:opacity-50"
                  >
                    <i className={`bi bi-arrow-clockwise ${isLoading ? 'animate-spin' : ''}`}></i>
                    <span className="font-medium">Refresh</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="flex border-b border-gray-200">
              {[
                { id: 'overview', label: 'Security Overview', icon: 'bi-shield-check' },
                { id: 'threats', label: 'Threat Analysis', icon: 'bi-exclamation-triangle' },
                { id: 'incidents', label: 'Recent Incidents', icon: 'bi-clock-history' },
                { id: 'monitoring', label: 'Live Monitoring', icon: 'bi-activity' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <i className={tab.icon}></i>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <>
              {/* Security Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {securityCards.map((card, index) => {
                  const colorClasses = getColorClasses(card.color);
                  const isAlert = card.color === 'red' || card.color === 'orange';
                  
                  return (
                    <div key={index} className={`p-6 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${colorClasses.bg} ${colorClasses.border}`}>
                      {/* Alert Badge */}
                      {isAlert && card.value > 0 && (
                        <div className="flex justify-end mb-2">
                          <div className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded-full animate-pulse">
                            ALERT
                          </div>
                        </div>
                      )}
                      
                      {/* Icon */}
                      <div className={`w-12 h-12 ${colorClasses.icon} rounded-xl flex items-center justify-center mb-4 mx-auto`}>
                        <i className={`${card.icon} text-white text-lg`}></i>
                      </div>
                      
                      {/* Value */}
                      <div className={`text-3xl font-bold text-center mb-2 font-mono ${colorClasses.text}`}>
                        {card.value.toLocaleString()}
                      </div>
                      
                      {/* Title */}
                      <div className={`text-sm font-semibold text-center mb-2 ${colorClasses.text}`}>
                        {card.title}
                      </div>
                      
                      {/* Description */}
                      <div className={`text-xs text-center ${colorClasses.text} opacity-75`}>
                        {card.description}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Security Trends Chart */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-700 px-6 py-4">
                  <h3 className="text-lg font-bold text-white">Security Trends (Last 7 Days)</h3>
                  <p className="text-indigo-100 text-sm">Monitor security events over time</p>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Trend Summary */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <i className="bi bi-trending-up text-blue-600 text-xl"></i>
                          <div>
                            <div className="font-semibold text-blue-900">Login Attempts</div>
                            <div className="text-sm text-blue-600">Daily average</div>
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-blue-900">
                          {Math.round((metrics.failed_logins_24h || 0) * 7 / 7)}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <i className="bi bi-shield-check text-green-600 text-xl"></i>
                          <div>
                            <div className="font-semibold text-green-900">Successful Logins</div>
                            <div className="text-sm text-green-600">Success rate</div>
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-green-900">
                          {Math.round(((metrics.unique_ips_24h || 0) - (metrics.failed_logins_24h || 0)) / (metrics.unique_ips_24h || 1) * 100)}%
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <i className="bi bi-exclamation-triangle text-orange-600 text-xl"></i>
                          <div>
                            <div className="font-semibold text-orange-900">Security Events</div>
                            <div className="text-sm text-orange-600">Critical incidents</div>
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-orange-900">
                          {metrics.critical_events_24h || 0}
                        </div>
                      </div>
                    </div>

                    {/* Visual Chart Placeholder */}
                    <div className="bg-gray-50 rounded-lg p-6 flex items-center justify-center">
                      <div className="text-center">
                        <i className="bi bi-bar-chart text-4xl text-gray-400 mb-4"></i>
                        <div className="text-gray-600 font-medium">Security Trends Chart</div>
                        <div className="text-sm text-gray-500">Interactive chart showing security metrics over time</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'threats' && (
            <div className="space-y-6">
              {/* Threat Intelligence */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-red-600 to-pink-700 px-6 py-4">
                  <h3 className="text-lg font-bold text-white">Threat Intelligence</h3>
                  <p className="text-red-100 text-sm">Active threats and suspicious activities</p>
                </div>
                <div className="p-6">
                  {suspiciousActivities && suspiciousActivities.length > 0 ? (
                    <div className="space-y-4">
                      {suspiciousActivities.slice(0, 5).map((activity, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                              <i className="bi bi-exclamation-triangle text-white"></i>
                            </div>
                            <div>
                              <div className="font-semibold text-red-900">{activity.type || 'Security Threat'}</div>
                              <div className="text-sm text-red-600">{activity.description || 'Suspicious activity detected'}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                              activity.severity === 'high' ? 'bg-red-200 text-red-800' :
                              activity.severity === 'medium' ? 'bg-orange-200 text-orange-800' :
                              'bg-yellow-200 text-yellow-800'
                            }`}>
                              {activity.severity || 'Medium'}
                            </span>
                            <button className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors">
                              Investigate
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <i className="bi bi-shield-check text-4xl text-green-500 mb-4"></i>
                      <div className="text-green-700 font-medium">No Active Threats</div>
                      <div className="text-sm text-green-600">Your system is secure</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Risk Assessment */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-4">
                    <h3 className="text-lg font-bold text-white">Risk Assessment</h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Authentication Risk</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-gray-200 rounded-full">
                            <div className={`h-2 rounded-full ${
                              metrics.failed_logins_24h > 10 ? 'bg-red-500 w-full' :
                              metrics.failed_logins_24h > 5 ? 'bg-orange-500 w-3/4' :
                              'bg-green-500 w-1/4'
                            }`}></div>
                          </div>
                          <span className="text-sm font-medium">
                            {metrics.failed_logins_24h > 10 ? 'High' :
                             metrics.failed_logins_24h > 5 ? 'Medium' : 'Low'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">System Access Risk</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-gray-200 rounded-full">
                            <div className="h-2 bg-blue-500 w-1/3 rounded-full"></div>
                          </div>
                          <span className="text-sm font-medium">Low</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Compliance Risk</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-gray-200 rounded-full">
                            <div className={`h-2 rounded-full ${
                              metrics.compliance_violations_30d > 5 ? 'bg-red-500 w-full' :
                              metrics.compliance_violations_30d > 0 ? 'bg-orange-500 w-1/2' :
                              'bg-green-500 w-1/4'
                            }`}></div>
                          </div>
                          <span className="text-sm font-medium">
                            {metrics.compliance_violations_30d > 5 ? 'High' :
                             metrics.compliance_violations_30d > 0 ? 'Medium' : 'Low'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-600 to-indigo-700 px-6 py-4">
                    <h3 className="text-lg font-bold text-white">Security Recommendations</h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-3">
                      {metrics.failed_logins_24h > 5 && (
                        <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                          <i className="bi bi-exclamation-triangle text-red-600 mt-1"></i>
                          <div>
                            <div className="font-medium text-red-900">Review Failed Logins</div>
                            <div className="text-sm text-red-600">Multiple failed login attempts detected</div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                        <i className="bi bi-shield-check text-blue-600 mt-1"></i>
                        <div>
                          <div className="font-medium text-blue-900">Enable 2FA</div>
                          <div className="text-sm text-blue-600">Strengthen authentication security</div>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                        <i className="bi bi-clock text-green-600 mt-1"></i>
                        <div>
                          <div className="font-medium text-green-900">Regular Audits</div>
                          <div className="text-sm text-green-600">Schedule monthly security reviews</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'incidents' && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4">
                <h3 className="text-lg font-bold text-white">Recent Security Incidents</h3>
                <p className="text-blue-100 text-sm">Latest security events and incidents</p>
              </div>
              <div className="p-6">
                {recentEvents && recentEvents.length > 0 ? (
                  <div className="space-y-4">
                    {recentEvents.slice(0, 10).map((event, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            event.event === 'failed_login' ? 'bg-red-100 text-red-600' :
                            event.event === 'login' ? 'bg-green-100 text-green-600' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                            <i className={`bi ${
                              event.event === 'failed_login' ? 'bi-shield-x' :
                              event.event === 'login' ? 'bi-shield-check' :
                              'bi-shield'
                            }`}></i>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {event.event?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Security Event'}
                            </div>
                            <div className="text-sm text-gray-600">
                              {event.description || 'No description available'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {event.user?.name || 'System'} • {event.ip_address || 'Unknown IP'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">
                            {new Date(event.created_at).toLocaleTimeString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(event.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <i className="bi bi-clock-history text-4xl text-gray-400 mb-4"></i>
                    <div className="text-gray-600 font-medium">No Recent Incidents</div>
                    <div className="text-sm text-gray-500">All security events are being monitored</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'monitoring' && (
            <div className="space-y-6">
              {/* Live Activity Feed */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-emerald-700 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white">Live Security Monitoring</h3>
                      <p className="text-green-100 text-sm">Real-time security events as they happen</p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-white">Live</span>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {recentEvents && recentEvents.slice(0, 15).map((event, index) => (
                      <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg animate-in slide-in-from-right" style={{ animationDelay: `${index * 100}ms` }}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          event.event === 'failed_login' ? 'bg-red-100 text-red-600' :
                          event.event === 'login' ? 'bg-green-100 text-green-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          <i className={`bi ${
                            event.event === 'failed_login' ? 'bi-shield-x' :
                            event.event === 'login' ? 'bi-shield-check' :
                            'bi-shield'
                          } text-sm`}></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900 text-sm">
                              {event.event?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Event'}
                            </span>
                            <span className="text-xs text-gray-500">•</span>
                            <span className="text-xs text-gray-500">{event.user?.name || 'System'}</span>
                          </div>
                          <p className="text-xs text-gray-600 truncate">
                            {event.description || 'Security event occurred'}
                          </p>
                        </div>
                        <div className="text-xs text-gray-500 whitespace-nowrap">
                          {new Date(event.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* System Health */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <i className="bi bi-cpu text-green-600 text-xl"></i>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">System Health</h4>
                      <p className="text-sm text-gray-600">Overall system status</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-green-600 mb-2">Healthy</div>
                  <div className="text-sm text-gray-600">All systems operational</div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <i className="bi bi-activity text-blue-600 text-xl"></i>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Active Sessions</h4>
                      <p className="text-sm text-gray-600">Current user sessions</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-blue-600 mb-2">{metrics.unique_ips_24h || 0}</div>
                  <div className="text-sm text-gray-600">Active connections</div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <i className="bi bi-shield-lock text-purple-600 text-xl"></i>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Security Level</h4>
                      <p className="text-sm text-gray-600">Current threat level</p>
                    </div>
                  </div>
                  <div className={`text-2xl font-bold mb-2 ${
                    securityLevel.color === 'green' ? 'text-green-600' :
                    securityLevel.color === 'blue' ? 'text-blue-600' :
                    securityLevel.color === 'orange' ? 'text-orange-600' :
                    'text-red-600'
                  }`}>
                    {securityLevel.level}
                  </div>
                  <div className="text-sm text-gray-600">Threat assessment</div>
                </div>
              </div>
            </div>
          )}

          {/* Security Alerts */}
          {(metrics.failed_logins_24h > 5 || metrics.critical_events_24h > 0) && (
            <div className="bg-gradient-to-r from-red-500 via-red-600 to-pink-600 rounded-3xl p-8 shadow-2xl border border-red-300 overflow-hidden">
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl">
                    <i className="bi bi-exclamation-triangle text-3xl text-white animate-pulse"></i>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold text-white">Security Alert</h3>
                      <div className="px-3 py-1 bg-white/20 text-white rounded-full text-sm font-bold animate-pulse">
                        IMMEDIATE ATTENTION REQUIRED
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {metrics.failed_logins_24h > 5 && (
                        <div className="flex items-center gap-2 text-red-100">
                          <i className="bi bi-shield-x text-lg"></i>
                          <span className="font-medium">{metrics.failed_logins_24h} failed login attempts in 24h</span>
                        </div>
                      )}
                      {metrics.critical_events_24h > 0 && (
                        <div className="flex items-center gap-2 text-red-100">
                          <i className="bi bi-exclamation-triangle text-lg"></i>
                          <span className="font-medium">{metrics.critical_events_24h} critical security events detected</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/audit-logs?severity=critical"
                    className="px-6 py-3 bg-white text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-105 flex items-center gap-2 font-semibold shadow-lg"
                  >
                    <i className="bi bi-eye"></i>
                    Review Events
                  </Link>
                  <button className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all duration-200 hover:scale-105 flex items-center gap-2 font-semibold backdrop-blur-sm">
                    <i className="bi bi-telephone"></i>
                    Contact Admin
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Security Status */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <i className="bi bi-shield-check text-white text-xl"></i>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">System Security Status</h2>
                    <p className="text-blue-100 text-sm">Overall security health assessment</p>
                  </div>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                  metrics.failed_logins_24h > 5 || metrics.critical_events_24h > 0
                    ? 'bg-red-500 text-white'
                    : 'bg-green-500 text-white'
                }`}>
                  <i className={`bi ${
                    metrics.failed_logins_24h > 5 || metrics.critical_events_24h > 0
                      ? 'bi-shield-x'
                      : 'bi-shield-check'
                  } text-sm`}></i>
                  <span className="text-sm font-medium">
                    {metrics.failed_logins_24h > 5 || metrics.critical_events_24h > 0 ? 'At Risk' : 'Secure'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Authentication Security */}
                <div className="text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                    metrics.failed_logins_24h > 5 ? 'bg-red-100' : 'bg-green-100'
                  }`}>
                    <i className={`bi bi-key text-2xl ${
                      metrics.failed_logins_24h > 5 ? 'text-red-600' : 'text-green-600'
                    }`}></i>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Authentication</h3>
                  <p className={`text-sm ${
                    metrics.failed_logins_24h > 5 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {metrics.failed_logins_24h > 5 ? 'Multiple failures detected' : 'Secure'}
                  </p>
                </div>

                {/* System Access */}
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 mx-auto mb-4 rounded-full flex items-center justify-center">
                    <i className="bi bi-globe text-blue-600 text-2xl"></i>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">System Access</h3>
                  <p className="text-sm text-blue-600">
                    {metrics.unique_ips_24h} unique IPs
                  </p>
                </div>

                {/* Compliance */}
                <div className="text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                    metrics.compliance_violations_30d > 0 ? 'bg-orange-100' : 'bg-green-100'
                  }`}>
                    <i className={`bi bi-clipboard-check text-2xl ${
                      metrics.compliance_violations_30d > 0 ? 'text-orange-600' : 'text-green-600'
                    }`}></i>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Compliance</h3>
                  <p className={`text-sm ${
                    metrics.compliance_violations_30d > 0 ? 'text-orange-600' : 'text-green-600'
                  }`}>
                    {metrics.compliance_violations_30d > 0 ? `${metrics.compliance_violations_30d} issues` : 'Compliant'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}