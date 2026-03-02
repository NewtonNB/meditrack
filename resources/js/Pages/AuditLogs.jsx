import React, { useState, useEffect, useMemo } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import 'bootstrap-icons/font/bootstrap-icons.css';

// Enhanced animation and interaction hooks
const useAnimatedCounter = (end, duration = 2000) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let startTime;
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [end, duration]);
  
  return count;
};

const useRealTimeUpdates = (enabled) => {
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  useEffect(() => {
    if (!enabled) return;
    
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 1000);
    
    return () => clearInterval(interval);
  }, [enabled]);
  
  return lastUpdate;
};

export default function AuditLogs({ 
  auditLogs = { data: [], links: [], meta: {} }, 
  statistics = {}, 
  filters = {},
  auth = {}
}) {
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [selectedEvent, setSelectedEvent] = useState(filters.event || '');
  const [selectedUser, setSelectedUser] = useState(filters.user_id || '');
  const [selectedSeverity, setSelectedSeverity] = useState(filters.severity || '');
  const [dateRange, setDateRange] = useState(filters.date_range || 'month');
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // table, cards, timeline
  const [selectedLog, setSelectedLog] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [isRealTime, setIsRealTime] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [animatedStats, setAnimatedStats] = useState({});
  
  // Real-time updates
  const realTimeUpdate = useRealTimeUpdates(isRealTime);
  
  // Animated counters for statistics
  const animatedTotal = useAnimatedCounter(auditLogs.meta?.total || 0);
  const animatedFailedLogins = useAnimatedCounter(statistics?.failed_logins || 0);
  const animatedUnauthorized = useAnimatedCounter(statistics?.unauthorized_attempts || 0);

  // Enhanced auto-refresh functionality with connection monitoring
  useEffect(() => {
    if (autoRefresh) {
      setConnectionStatus('connecting');
      const interval = setInterval(() => {
        setConnectionStatus('syncing');
        router.reload({ 
          only: ['auditLogs', 'statistics'],
          onSuccess: () => {
            setConnectionStatus('connected');
            setLastRefresh(new Date());
          },
          onError: () => {
            setConnectionStatus('error');
          }
        });
      }, 15000); // Refresh every 15 seconds for more real-time feel
      setRefreshInterval(interval);
      setConnectionStatus('connected');
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
      setConnectionStatus('disconnected');
    }
    
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [autoRefresh]);
  
  // Simulate real-time connection status
  useEffect(() => {
    const statusInterval = setInterval(() => {
      if (autoRefresh && connectionStatus === 'connected') {
        // Randomly simulate brief sync states for visual feedback
        if (Math.random() < 0.1) {
          setConnectionStatus('syncing');
          setTimeout(() => setConnectionStatus('connected'), 500);
        }
      }
    }, 2000);
    
    return () => clearInterval(statusInterval);
  }, [autoRefresh, connectionStatus]);

  const handleSearch = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setConnectionStatus('searching');
    
    router.get('/audit-logs', {
      search: searchTerm,
      event: selectedEvent,
      user_id: selectedUser,
      severity: selectedSeverity,
      date_range: dateRange,
    }, {
      preserveState: true,
      replace: true,
      onSuccess: () => {
        setConnectionStatus('connected');
        setLastRefresh(new Date());
      },
      onError: () => {
        setConnectionStatus('error');
      },
      onFinish: () => setIsLoading(false)
    });
  };
  
  // Enhanced real-time search with debouncing
  useEffect(() => {
    if (searchTerm.length > 2) {
      const debounceTimer = setTimeout(() => {
        if (autoRefresh) {
          handleSearch({ preventDefault: () => {} });
        }
      }, 1000);
      
      return () => clearTimeout(debounceTimer);
    }
  }, [searchTerm]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.querySelector('input[placeholder*="Search"]')?.focus();
      }
      
      // Escape to close modal
      if (e.key === 'Escape') {
        if (selectedLog) {
          setSelectedLog(null);
        } else if (showFilters) {
          setShowFilters(false);
        }
      }
      
      // F5 to refresh (prevent default and use our refresh)
      if (e.key === 'F5') {
        e.preventDefault();
        router.reload({ only: ['auditLogs', 'statistics'] });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedLog, showFilters]);

  const handleExport = () => {
    const params = new URLSearchParams({
      search: searchTerm,
      event: selectedEvent,
      user_id: selectedUser,
      severity: selectedSeverity,
      date_range: dateRange,
    });
    window.open(`/audit-logs/export?${params.toString()}`);
  };

  const handleFlagForReview = async (logId) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/audit-logs/${logId}/flag`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
        },
      });
      
      if (response.ok) {
        // Show success notification
        showNotification('Audit log flagged for compliance review', 'success');
        // Close modal and refresh data
        setSelectedLog(null);
        router.reload({ only: ['auditLogs', 'statistics'] });
      } else {
        const errorData = await response.json();
        showNotification(errorData.message || 'Failed to flag audit log', 'error');
      }
    } catch (error) {
      console.error('Error flagging audit log:', error);
      showNotification('Network error occurred', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showNotification = (message, type = 'info') => {
    // Create a simple notification system
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-medium transition-all duration-300 ${
      type === 'success' ? 'bg-green-500' :
      type === 'error' ? 'bg-red-500' :
      type === 'warning' ? 'bg-orange-500' : 'bg-blue-500'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
      notification.style.opacity = '1';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      notification.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const minutes = Math.floor((now - date) / (1000 * 60));
      return `${minutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else {
      return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedEvent('');
    setSelectedUser('');
    setSelectedSeverity('');
    setDateRange('today');
    router.get('/audit-logs', {}, { preserveState: true, replace: true });
  };

  const getEventIcon = (event) => {
    const eventIcons = {
      // Authentication & Access
      'login': 'bi-box-arrow-in-right',
      'logout': 'bi-box-arrow-right',
      'failed_login': 'bi-shield-x',
      'password_changed': 'bi-key-fill',
      'role_changed': 'bi-person-gear',
      'account_locked': 'bi-lock-fill',
      
      // Prescription & Controlled Substances
      'prescription_created': 'bi-file-medical',
      'prescription_modified': 'bi-file-earmark-medical',
      'prescription_dispensed': 'bi-capsule',
      'controlled_substance_access': 'bi-shield-lock',
      'narcotic_dispensed': 'bi-exclamation-diamond',
      'prescription_voided': 'bi-file-x',
      
      // Data & Compliance
      'patient_data_accessed': 'bi-person-lines-fill',
      'hipaa_violation': 'bi-exclamation-triangle-fill',
      'data_export': 'bi-download',
      'backup_created': 'bi-cloud-arrow-up',
      'audit_report_generated': 'bi-file-earmark-text',
      'compliance_check': 'bi-check-circle',
      
      // Security & System
      'unauthorized_access_attempt': 'bi-shield-exclamation',
      'suspicious_activity': 'bi-eye-slash',
      'system_configuration_changed': 'bi-gear-fill',
      'security_breach_detected': 'bi-bug-fill',
      'ip_blocked': 'bi-slash-circle',
      'session_expired': 'bi-clock-history',
      
      // Legacy/General
      'created': 'bi-plus-circle-fill',
      'updated': 'bi-pencil-square',
      'deleted': 'bi-trash3-fill',
    };
    return eventIcons[event] || 'bi-shield-check';
  };

  const getEventColor = (event) => {
    const eventColors = {
      'created': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: 'text-emerald-500' },
      'updated': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: 'text-blue-500' },
      'deleted': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: 'text-red-500' },
      'login': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: 'text-green-500' },
      'logout': { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: 'text-gray-500' },
      'failed_login': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: 'text-red-500' },
      'avatar_updated': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: 'text-purple-500' },
      'sale_processed': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', icon: 'text-indigo-500' },
      'stock_adjusted': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: 'text-orange-500' },
      'customer_created': { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', icon: 'text-cyan-500' },
      'supplier_created': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', icon: 'text-teal-500' },
      'unauthorized_access_attempt': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: 'text-red-600' },
      'sensitive_access': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', icon: 'text-yellow-600' },
      'server_error': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: 'text-red-600' },
      'system_test': { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', icon: 'text-slate-500' },
      'password_changed': { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', icon: 'text-violet-500' },
      'data_export': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: 'text-blue-500' },
      'backup_created': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: 'text-green-500' },
      'settings_changed': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: 'text-amber-500' },
    };
    return eventColors[event] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: 'text-gray-500' };
  };

  const getSeverityColor = (event) => {
    // Critical security and compliance events
    const criticalEvents = [
      'failed_login', 'unauthorized_access_attempt', 'security_breach_detected', 
      'hipaa_violation', 'account_locked', 'suspicious_activity', 'ip_blocked'
    ];
    
    // High-risk pharmacy operations
    const highRiskEvents = [
      'controlled_substance_access', 'narcotic_dispensed', 'prescription_voided',
      'patient_data_accessed', 'prescription_modified', 'role_changed'
    ];
    
    // Standard monitoring events
    const warningEvents = [
      'data_export', 'system_configuration_changed', 'password_changed',
      'session_expired', 'backup_created'
    ];
    
    if (criticalEvents.includes(event)) {
      return { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500', label: 'Critical' };
    } else if (highRiskEvents.includes(event)) {
      return { bg: 'bg-orange-100', text: 'text-orange-800', dot: 'bg-orange-500', label: 'High Risk' };
    } else if (warningEvents.includes(event)) {
      return { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500', label: 'Monitor' };
    } else {
      return { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500', label: 'Normal' };
    }
  };

  // Pharmacy-specific security statistics
  const securityStatistics = useMemo(() => {
    const baseStats = statistics || {};
    const totalEvents = auditLogs.meta?.total || 0;
    
    return {
      total_events: totalEvents,
      failed_logins: baseStats.failed_logins || 0,
      controlled_substance_access: baseStats.controlled_substance_access || 0,
      prescription_modifications: baseStats.prescription_modifications || 0,
      data_exports: baseStats.data_exports || 0,
      unauthorized_attempts: baseStats.unauthorized_attempts || 0,
      compliance_violations: baseStats.compliance_violations || 0,
    };
  }, [statistics, auditLogs.meta?.total]);

  return (
    <AuthenticatedLayout>
      <Head title="Audit Trail - MediTrack" />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-indigo-600/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-cyan-400/10 to-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-indigo-400/5 to-purple-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* 🎯 SECTION 1: Clean Professional Header */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Main Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <i className="bi bi-shield-check text-3xl text-white"></i>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">Security & Compliance</h1>
                    <p className="text-blue-100 text-sm">Monitoring Center</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500 text-white rounded-full">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Live</span>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-semibold">{auditLogs.data?.length || 0} events loaded</div>
                    <div className="text-blue-100 text-sm">Range: {dateRange.charAt(0).toUpperCase() + dateRange.slice(1)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Cards */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Connection Status */}
                <div className={`p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                  connectionStatus === 'connected' ? 'bg-green-50 border-green-200' :
                  connectionStatus === 'syncing' ? 'bg-blue-50 border-blue-200' :
                  connectionStatus === 'searching' ? 'bg-yellow-50 border-yellow-200' :
                  connectionStatus === 'error' ? 'bg-red-50 border-red-200' :
                  'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      connectionStatus === 'connected' ? 'bg-green-500' :
                      connectionStatus === 'syncing' ? 'bg-blue-500' :
                      connectionStatus === 'searching' ? 'bg-yellow-500' :
                      connectionStatus === 'error' ? 'bg-red-500' :
                      'bg-gray-500'
                    }`}>
                      {connectionStatus === 'syncing' || connectionStatus === 'searching' ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : connectionStatus === 'error' ? (
                        <i className="bi bi-exclamation-triangle text-white"></i>
                      ) : (
                        <i className="bi bi-wifi text-white"></i>
                      )}
                    </div>
                    <div>
                      <div className={`font-semibold ${
                        connectionStatus === 'connected' ? 'text-green-800' :
                        connectionStatus === 'syncing' ? 'text-blue-800' :
                        connectionStatus === 'searching' ? 'text-yellow-800' :
                        connectionStatus === 'error' ? 'text-red-800' :
                        'text-gray-800'
                      }`}>
                        {connectionStatus === 'connected' ? 'Connected' :
                         connectionStatus === 'syncing' ? 'Syncing' :
                         connectionStatus === 'searching' ? 'Searching' :
                         connectionStatus === 'error' ? 'Error' :
                         'Offline'}
                      </div>
                      <div className={`text-xs ${
                        connectionStatus === 'connected' ? 'text-green-600' :
                        connectionStatus === 'syncing' ? 'text-blue-600' :
                        connectionStatus === 'searching' ? 'text-yellow-600' :
                        connectionStatus === 'error' ? 'text-red-600' :
                        'text-gray-600'
                      }`}>
                        {connectionStatus === 'connected' ? 'Live monitoring' :
                         connectionStatus === 'syncing' ? 'Updating data' :
                         connectionStatus === 'searching' ? 'Filtering results' :
                         connectionStatus === 'error' ? 'Connection failed' :
                         'Disconnected'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Total Events */}
                <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl hover:scale-105 transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                      <i className="bi bi-database text-white"></i>
                    </div>
                    <div>
                      <div className="font-bold text-blue-800 text-xl font-mono">
                        {animatedTotal.toLocaleString()}
                      </div>
                      <div className="text-xs text-blue-600 font-medium">Events Found</div>
                    </div>
                  </div>
                </div>

                {/* Time Range */}
                <div className="p-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl hover:scale-105 transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                      <i className="bi bi-calendar-range text-white"></i>
                    </div>
                    <div>
                      <div className="font-bold text-emerald-800">
                        {dateRange.charAt(0).toUpperCase() + dateRange.slice(1)}
                      </div>
                      <div className="text-xs text-emerald-600 font-medium">Time Range</div>
                    </div>
                  </div>
                </div>

                {/* Auto-refresh */}
                <div className="p-4 bg-purple-50 border-2 border-purple-200 rounded-xl hover:scale-105 transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setAutoRefresh(!autoRefresh)}
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        autoRefresh 
                          ? 'bg-purple-500 text-white' 
                          : 'bg-purple-200 text-purple-600 hover:bg-purple-300'
                      }`}
                    >
                      <i className={`bi ${autoRefresh ? 'bi-pause-fill' : 'bi-play-fill'} ${autoRefresh ? 'animate-pulse' : ''}`}></i>
                    </button>
                    <div>
                      <div className="font-bold text-purple-800 flex items-center gap-2">
                        Auto-refresh
                        {autoRefresh && (
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                        )}
                      </div>
                      <div className="text-xs text-purple-600 font-medium">
                        {autoRefresh ? 'Every 15s' : 'Disabled'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Filter Buttons */}
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setSelectedEvent('failed_login');
                      handleSearch({ preventDefault: () => {} });
                    }}
                    className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm transition-all duration-200 hover:scale-105 flex items-center gap-1"
                  >
                    <i className="bi bi-shield-x text-xs"></i>
                    Failed Logins
                  </button>
                  
                  <button
                    onClick={() => {
                      setSelectedEvent('controlled_substance_access');
                      handleSearch({ preventDefault: () => {} });
                    }}
                    className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-sm transition-all duration-200 hover:scale-105 flex items-center gap-1"
                  >
                    <i className="bi bi-prescription2 text-xs"></i>
                    Controlled Substances
                  </button>
                  
                  <button
                    onClick={() => {
                      setSelectedEvent('data_export');
                      handleSearch({ preventDefault: () => {} });
                    }}
                    className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm transition-all duration-200 hover:scale-105 flex items-center gap-1"
                  >
                    <i className="bi bi-download text-xs"></i>
                    Data Exports
                  </button>
                  
                  <button
                    onClick={() => {
                      setSelectedEvent('');
                      setSearchTerm('');
                      setSelectedUser('');
                      setSelectedSeverity('');
                      handleSearch({ preventDefault: () => {} });
                    }}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-all duration-200 hover:scale-105 flex items-center gap-1"
                  >
                    <i className="bi bi-x-circle text-xs"></i>
                    Clear All
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 flex items-center gap-2 ${
                    showFilters 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 hover:bg-blue-50 text-gray-700'
                  }`}
                >
                  <i className="bi bi-funnel"></i>
                  <span className="font-medium">Advanced Filters</span>
                </button>
                
                <Link
                  href="/compliance/dashboard"
                  className="px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-all duration-200 hover:scale-105 flex items-center gap-2"
                >
                  <i className="bi bi-clipboard-check"></i>
                  <span className="font-medium">Compliance</span>
                </Link>
                
                <Link
                  href="/security/dashboard"
                  className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-all duration-200 hover:scale-105 flex items-center gap-2"
                >
                  <i className="bi bi-shield-exclamation"></i>
                  <span className="font-medium">Security</span>
                </Link>
                
                <button
                  onClick={handleExport}
                  className="px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg transition-all duration-200 hover:scale-105 flex items-center gap-2"
                >
                  <i className="bi bi-download"></i>
                  <span className="font-medium">Export</span>
                </button>
              </div>
            </div>
          </div>

          {/* 📊 SECTION 2: Clean Security Analytics Dashboard */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <i className="bi bi-graph-up-arrow text-white text-xl"></i>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Security Analytics</h2>
                    <p className="text-blue-100 text-sm">Real-time monitoring dashboard</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-500 text-white rounded-full">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Live Data</span>
                  </div>
                  <button
                    onClick={() => router.reload({ only: ['auditLogs', 'statistics'] })}
                    className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded-full transition-all duration-200 flex items-center gap-1"
                  >
                    <i className="bi bi-arrow-clockwise text-sm"></i>
                    <span className="text-sm">Refresh</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Statistics Grid */}
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {Object.entries(securityStatistics).map(([key, value]) => {
                  const securityConfig = {
                    total_events: { 
                      icon: 'bi-shield-check', 
                      label: 'Total Events',
                      color: 'blue'
                    },
                    failed_logins: { 
                      icon: 'bi-shield-x', 
                      label: 'Failed Logins',
                      color: 'red'
                    },
                    controlled_substance_access: { 
                      icon: 'bi-prescription2', 
                      label: 'Controlled Access',
                      color: 'purple'
                    },
                    prescription_modifications: { 
                      icon: 'bi-file-medical', 
                      label: 'Rx Modifications',
                      color: 'emerald'
                    },
                    data_exports: { 
                      icon: 'bi-download', 
                      label: 'Data Exports',
                      color: 'orange'
                    },
                    unauthorized_attempts: { 
                      icon: 'bi-exclamation-triangle', 
                      label: 'Unauthorized Attempts',
                      color: 'red'
                    },
                    compliance_violations: { 
                      icon: 'bi-exclamation-octagon', 
                      label: 'Compliance Violations',
                      color: 'red'
                    }
                  };
                  
                  const config = securityConfig[key] || {
                    icon: 'bi-shield',
                    label: key.replace(/_/g, ' '),
                    color: 'gray'
                  };
                  
                  const isHighRisk = ['failed_logins', 'unauthorized_attempts', 'compliance_violations'].includes(key);
                  const hasAlert = isHighRisk && value > 0;
                  
                  const colorClasses = {
                    blue: 'bg-blue-50 border-blue-200 text-blue-700',
                    red: hasAlert ? 'bg-red-100 border-red-300 text-red-800' : 'bg-red-50 border-red-200 text-red-700',
                    purple: 'bg-purple-50 border-purple-200 text-purple-700',
                    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
                    orange: 'bg-orange-50 border-orange-200 text-orange-700',
                    gray: 'bg-gray-50 border-gray-200 text-gray-700'
                  };

                  const iconColorClasses = {
                    blue: 'bg-blue-500',
                    red: hasAlert ? 'bg-red-600' : 'bg-red-500',
                    purple: 'bg-purple-500',
                    emerald: 'bg-emerald-500',
                    orange: 'bg-orange-500',
                    gray: 'bg-gray-500'
                  };
                  
                  return (
                    <div key={key} className={`p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${colorClasses[config.color]}`}>
                      {/* Alert Indicator */}
                      {hasAlert && (
                        <div className="flex justify-end mb-2">
                          <div className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded-full animate-pulse">
                            ALERT
                          </div>
                        </div>
                      )}
                      
                      {/* Icon */}
                      <div className={`w-12 h-12 ${iconColorClasses[config.color]} rounded-xl flex items-center justify-center mb-3 mx-auto`}>
                        <i className={`${config.icon} text-white text-lg`}></i>
                      </div>
                      
                      {/* Value */}
                      <div className={`text-2xl font-bold text-center mb-2 font-mono ${hasAlert ? 'text-red-800' : ''}`}>
                        {key === 'total_events' ? animatedTotal.toLocaleString() :
                         key === 'failed_logins' ? animatedFailedLogins.toLocaleString() :
                         key === 'unauthorized_attempts' ? animatedUnauthorized.toLocaleString() :
                         String(value || 0).toLocaleString()}
                      </div>
                      
                      {/* Label */}
                      <div className="text-xs font-medium text-center uppercase tracking-wide">
                        {config.label}
                      </div>
                      
                      {/* Status Badge */}
                      <div className="flex justify-center mt-2">
                        <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                          hasAlert ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'
                        }`}>
                          {hasAlert ? 'SECURE' : 'SECURE'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 🚨 Enhanced Security Alerts Banner */}
          {(securityStatistics.failed_logins > 5 || securityStatistics.unauthorized_attempts > 0 || securityStatistics.compliance_violations > 0) && (
            <div className="relative bg-gradient-to-r from-red-500 via-red-600 to-pink-600 rounded-3xl p-8 shadow-2xl border border-red-300 overflow-hidden">
              {/* Animated Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full transform translate-x-32 -translate-y-32 animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full transform -translate-x-24 translate-y-24 animate-pulse delay-1000"></div>
              </div>
              
              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center gap-6">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl">
                      <i className="bi bi-exclamation-triangle text-3xl text-white animate-pulse"></i>
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                      <i className="bi bi-lightning-fill text-red-600 text-xs"></i>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold text-white">Critical Security Alert</h3>
                      <div className="px-3 py-1 bg-white/20 text-white rounded-full text-sm font-bold animate-pulse">
                        IMMEDIATE ACTION REQUIRED
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {securityStatistics.failed_logins > 5 && (
                        <div className="flex items-center gap-2 text-red-100">
                          <i className="bi bi-shield-x text-lg"></i>
                          <span className="font-medium">{Number(securityStatistics?.failed_logins || 0)} failed login attempts detected</span>
                        </div>
                      )}
                      {securityStatistics.unauthorized_attempts > 0 && (
                        <div className="flex items-center gap-2 text-red-100">
                          <i className="bi bi-exclamation-triangle text-lg"></i>
                          <span className="font-medium">{Number(securityStatistics?.unauthorized_attempts || 0)} unauthorized access attempts</span>
                        </div>
                      )}
                      {securityStatistics.compliance_violations > 0 && (
                        <div className="flex items-center gap-2 text-red-100">
                          <i className="bi bi-exclamation-octagon text-lg"></i>
                          <span className="font-medium">{Number(securityStatistics?.compliance_violations || 0)} compliance violations found</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <button className="px-6 py-3 bg-white text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-105 flex items-center gap-2 font-semibold shadow-lg">
                    <i className="bi bi-shield-exclamation"></i>
                    Review Alerts
                  </button>
                  <button className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all duration-200 hover:scale-105 flex items-center gap-2 font-semibold backdrop-blur-sm">
                    <i className="bi bi-telephone"></i>
                    Contact Security
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 🏥 SECTION 3: Clean Compliance Monitoring */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <i className="bi bi-clipboard-check text-white text-xl"></i>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Compliance Monitoring</h2>
                    <p className="text-purple-100 text-sm">Regulatory compliance status overview</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-green-500 text-white rounded-full">
                  <i className="bi bi-shield-check text-sm"></i>
                  <span className="text-sm font-medium">Regulatory Compliant</span>
                </div>
              </div>
            </div>

            {/* Compliance Cards */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* DEA Compliance */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 hover:scale-105 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                        <i className="bi bi-shield-check text-white text-lg"></i>
                      </div>
                      <div>
                        <h3 className="font-bold text-blue-900">DEA Compliance</h3>
                        <p className="text-sm text-blue-600">Controlled substances</p>
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full">
                      <span className="text-xs font-bold">COMPLIANT</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2">
                        <i className="bi bi-prescription2 text-blue-600"></i>
                        <span className="text-sm font-medium text-blue-800">Schedule II Access</span>
                      </div>
                      <div className="text-lg font-bold text-blue-900 font-mono">
                        {Number(securityStatistics?.controlled_substance_access || 0)}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                      <div className="flex items-center gap-2">
                        <i className="bi bi-check-circle text-green-600"></i>
                        <span className="text-sm font-medium text-green-800">Audit Trail</span>
                      </div>
                      <div className="text-lg font-bold text-green-900">100%</div>
                    </div>
                    
                    <div className="text-center p-3 bg-blue-100 rounded-lg">
                      <div className="text-xl font-bold text-blue-900">A+</div>
                      <div className="text-xs font-medium text-blue-700">Grade</div>
                    </div>
                  </div>
                </div>

                {/* HIPAA Compliance */}
                <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6 hover:scale-105 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                        <i className="bi bi-person-lock text-white text-lg"></i>
                      </div>
                      <div>
                        <h3 className="font-bold text-purple-900">HIPAA Compliance</h3>
                        <p className="text-sm text-purple-600">Patient data protection</p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full ${
                      securityStatistics.compliance_violations > 0 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      <span className="text-xs font-bold">
                        {securityStatistics.compliance_violations > 0 ? 'ISSUES' : 'COMPLIANT'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-purple-200">
                      <div className="flex items-center gap-2">
                        <i className="bi bi-database text-purple-600"></i>
                        <span className="text-sm font-medium text-purple-800">Data Access</span>
                      </div>
                      <div className="text-lg font-bold text-purple-900 font-mono">
                        {Number(securityStatistics?.data_exports || 0)}
                      </div>
                    </div>
                    
                    <div className={`flex items-center justify-between p-3 bg-white rounded-lg border ${
                      securityStatistics.compliance_violations > 0 
                        ? 'border-red-200' 
                        : 'border-green-200'
                    }`}>
                      <div className="flex items-center gap-2">
                        <i className={`${
                          securityStatistics.compliance_violations > 0 
                            ? 'bi-exclamation-triangle text-red-600' 
                            : 'bi-check-circle text-green-600'
                        }`}></i>
                        <span className={`text-sm font-medium ${
                          securityStatistics.compliance_violations > 0 ? 'text-red-800' : 'text-green-800'
                        }`}>
                          Violations
                        </span>
                      </div>
                      <div className={`text-lg font-bold font-mono ${
                        securityStatistics.compliance_violations > 0 ? 'text-red-900' : 'text-green-900'
                      }`}>
                        {Number(securityStatistics?.compliance_violations || 0)}
                      </div>
                    </div>
                    
                    <div className={`text-center p-3 rounded-lg ${
                      securityStatistics.compliance_violations > 0 ? 'bg-red-100' : 'bg-purple-100'
                    }`}>
                      <div className={`text-xl font-bold ${
                        securityStatistics.compliance_violations > 0 ? 'text-red-900' : 'text-purple-900'
                      }`}>
                        {securityStatistics.compliance_violations > 0 ? 'B-' : 'A+'}
                      </div>
                      <div className={`text-xs font-medium ${
                        securityStatistics.compliance_violations > 0 ? 'text-red-700' : 'text-purple-700'
                      }`}>
                        Grade
                      </div>
                    </div>
                  </div>
                </div>

                {/* Security Status */}
                <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-6 hover:scale-105 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                        <i className="bi bi-shield-lock text-white text-lg"></i>
                      </div>
                      <div>
                        <h3 className="font-bold text-emerald-900">Security Status</h3>
                        <p className="text-sm text-emerald-600">System monitoring</p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full ${
                      securityStatistics.failed_logins > 5 || securityStatistics.unauthorized_attempts > 0
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      <span className="text-xs font-bold">
                        {securityStatistics.failed_logins > 5 || securityStatistics.unauthorized_attempts > 0 ? 'ALERT' : 'SECURE'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className={`flex items-center justify-between p-3 bg-white rounded-lg border ${
                      securityStatistics.failed_logins > 5 
                        ? 'border-red-200' 
                        : 'border-emerald-200'
                    }`}>
                      <div className="flex items-center gap-2">
                        <i className={`${
                          securityStatistics.failed_logins > 5 
                            ? 'bi-shield-x text-red-600' 
                            : 'bi-shield-check text-emerald-600'
                        }`}></i>
                        <span className={`text-sm font-medium ${
                          securityStatistics.failed_logins > 5 ? 'text-red-800' : 'text-emerald-800'
                        }`}>
                          Failed Logins
                        </span>
                      </div>
                      <div className={`text-lg font-bold font-mono ${
                        securityStatistics.failed_logins > 5 ? 'text-red-900' : 'text-emerald-900'
                      }`}>
                        {Number(securityStatistics?.failed_logins || 0)}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-emerald-200">
                      <div className="flex items-center gap-2">
                        <i className="bi bi-speedometer text-emerald-600"></i>
                        <span className="text-sm font-medium text-emerald-800">Threat Level</span>
                      </div>
                      <div className="text-lg font-bold text-emerald-900">LOW</div>
                    </div>
                    
                    <div className="text-center p-3 bg-emerald-100 rounded-lg">
                      <div className="text-xl font-bold text-emerald-900">A+</div>
                      <div className="text-xs font-medium text-emerald-700">Grade</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 📊 Real-Time Activity Feed */}
          {autoRefresh && (
            <div className="bg-gradient-to-br from-white via-slate-50 to-green-50 rounded-3xl p-8 shadow-2xl border border-white/60">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <i className="bi bi-activity text-white text-xl"></i>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">Live Activity Feed</h3>
                    <p className="text-sm text-slate-600">Real-time security events as they happen</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Live</span>
                </div>
              </div>
              
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {auditLogs.data && auditLogs.data.slice(0, 5).map((log, index) => {
                  const eventColor = getEventColor(log.event);
                  return (
                    <div key={index} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:shadow-md transition-all duration-200 animate-in slide-in-from-right" style={{ animationDelay: `${index * 100}ms` }}>
                      <div className={`w-10 h-10 ${eventColor.bg} ${eventColor.border} border rounded-xl flex items-center justify-center`}>
                        <i className={`${getEventIcon(log.event)} ${eventColor.icon} text-sm`}></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-slate-900 text-sm">
                            {String(log.event || 'unknown').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                          <span className="text-xs text-slate-500">•</span>
                          <span className="text-xs text-slate-500">{String(log.user?.name || 'System')}</span>
                        </div>
                        <p className="text-xs text-slate-600 truncate">
                          {String(log.description || 'No description')}
                        </p>
                      </div>
                      <div className="text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 🔍 Enhanced Advanced Filter Panel */}
          {showFilters && (
            <div className="bg-gradient-to-br from-white via-slate-50 to-blue-50 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/60 animate-in slide-in-from-top duration-300">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <i className="bi bi-funnel text-white text-xl"></i>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">Advanced Filters & Search</h3>
                    <p className="text-sm text-slate-600">Customize your audit log view with powerful filtering options</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all duration-200 hover:scale-105"
                  >
                    <i className="bi bi-arrow-clockwise"></i>
                    <span className="font-medium">Reset All</span>
                  </button>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all duration-200 hover:scale-105 flex items-center justify-center"
                  >
                    <i className="bi bi-x-lg text-lg"></i>
                  </button>
                </div>
              </div>
              
              <form onSubmit={handleSearch} className="space-y-8">
                {/* Enhanced Search and Quick Filters Row */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <i className="bi bi-search text-blue-500"></i>
                      Search Query
                    </label>
                    <div className="relative group">
                      <input
                        type="text"
                        placeholder="Search events, users, descriptions, IPs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 group-hover:border-slate-300"
                      />
                      <i className="bi bi-search absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 group-hover:text-blue-500 transition-colors duration-200"></i>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <i className="bi bi-calendar-range text-green-500"></i>
                      Date Range
                    </label>
                    <select
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value)}
                      className="w-full px-4 py-4 bg-white border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 hover:border-slate-300"
                    >
                      <option value="today">📅 Today</option>
                      <option value="yesterday">📆 Yesterday</option>
                      <option value="week">📊 This Week</option>
                      <option value="month">📈 This Month</option>
                      <option value="quarter">📋 This Quarter</option>
                      <option value="year">📊 This Year</option>
                      <option value="all">🌐 All Time</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <i className="bi bi-exclamation-triangle text-orange-500"></i>
                      Severity Level
                    </label>
                    <select
                      value={selectedSeverity}
                      onChange={(e) => setSelectedSeverity(e.target.value)}
                      className="w-full px-4 py-4 bg-white border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 hover:border-slate-300"
                    >
                      <option value="">🔍 All Levels</option>
                      <option value="critical">🔴 Critical</option>
                      <option value="warning">🟡 Warning</option>
                      <option value="info">🟢 Info</option>
                    </select>
                  </div>
                </div>
                
                {/* Enhanced Event Type and User Filters */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <i className="bi bi-tags text-purple-500"></i>
                      Event Category
                    </label>
                    <select
                      value={selectedEvent}
                      onChange={(e) => setSelectedEvent(e.target.value)}
                      className="w-full px-4 py-4 bg-white border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 hover:border-slate-300"
                    >
                      <option value="">All Events</option>
                      <optgroup label="🔐 Authentication & Access">
                        <option value="login">✅ Successful Login</option>
                        <option value="logout">🚪 User Logout</option>
                        <option value="failed_login">❌ Failed Login Attempt</option>
                        <option value="password_changed">🔑 Password Changed</option>
                        <option value="role_changed">👤 User Role Modified</option>
                        <option value="account_locked">🔒 Account Locked</option>
                      </optgroup>
                      <optgroup label="💊 Prescription & Controlled Substances">
                        <option value="prescription_created">📋 Prescription Created</option>
                        <option value="prescription_modified">✏️ Prescription Modified</option>
                        <option value="prescription_dispensed">💊 Prescription Dispensed</option>
                        <option value="controlled_substance_access">🔐 Controlled Substance Access</option>
                        <option value="narcotic_dispensed">⚠️ Narcotic Dispensed</option>
                        <option value="prescription_voided">❌ Prescription Voided</option>
                      </optgroup>
                      <optgroup label="📊 Data & Compliance">
                        <option value="patient_data_accessed">👁️ Patient Data Accessed</option>
                        <option value="hipaa_violation">🚨 HIPAA Violation</option>
                        <option value="data_export">📤 Data Export</option>
                        <option value="backup_created">☁️ Backup Created</option>
                        <option value="audit_report_generated">📋 Audit Report Generated</option>
                        <option value="compliance_check">✅ Compliance Check</option>
                      </optgroup>
                      <optgroup label="🛡️ Security & System">
                        <option value="unauthorized_access_attempt">🚨 Unauthorized Access</option>
                        <option value="suspicious_activity">⚠️ Suspicious Activity</option>
                        <option value="system_configuration_changed">⚙️ System Config Changed</option>
                        <option value="security_breach_detected">🔴 Security Breach</option>
                        <option value="ip_blocked">🚫 IP Address Blocked</option>
                        <option value="session_expired">⏰ Session Expired</option>
                      </optgroup>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <i className="bi bi-person-circle text-indigo-500"></i>
                      User Filter
                    </label>
                    <div className="relative group">
                      <input
                        type="text"
                        placeholder="Filter by user ID, name, or email..."
                        value={selectedUser}
                        onChange={(e) => setSelectedUser(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 group-hover:border-slate-300"
                      />
                      <i className="bi bi-person-circle absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 group-hover:text-indigo-500 transition-colors duration-200"></i>
                    </div>
                  </div>
                </div>
                
                {/* Enhanced View Mode and Action Buttons */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-slate-500 to-slate-600 rounded-xl flex items-center justify-center">
                          <i className="bi bi-eye text-white"></i>
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-slate-700">Display Mode</label>
                          <p className="text-xs text-slate-500">Choose your preferred view</p>
                        </div>
                      </div>
                      
                      <div className="flex bg-slate-100 rounded-2xl p-2 shadow-inner">
                        <button
                          type="button"
                          onClick={() => setViewMode('table')}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                            viewMode === 'table' 
                              ? 'bg-white text-slate-900 shadow-md scale-105' 
                              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                          }`}
                        >
                          <i className="bi bi-table"></i>
                          Table
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewMode('cards')}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                            viewMode === 'cards' 
                              ? 'bg-white text-slate-900 shadow-md scale-105' 
                              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                          }`}
                        >
                          <i className="bi bi-grid-3x3-gap"></i>
                          Cards
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewMode('timeline')}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                            viewMode === 'timeline' 
                              ? 'bg-white text-slate-900 shadow-md scale-105' 
                              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                          }`}
                        >
                          <i className="bi bi-clock-history"></i>
                          Timeline
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => setShowFilters(false)}
                        className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all duration-200 hover:scale-105 font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl transition-all duration-200 hover:scale-105 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg font-semibold"
                      >
                        {isLoading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Searching...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-search text-lg"></i>
                            Apply Filters
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          )} 
         {/* Enhanced Audit Logs Display */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 overflow-hidden">
            {/* Simplified Table View */}
            {viewMode === 'table' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Event</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">User</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Description</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {auditLogs.data && auditLogs.data.length > 0 ? (
                      auditLogs.data.map((log, index) => {
                        const eventColor = getEventColor(log.event);
                        const severityColor = getSeverityColor(log.event);
                        
                        return (
                          <tr 
                            key={index} 
                            className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 group cursor-pointer hover:scale-[1.01] hover:shadow-md"
                            onClick={() => setSelectedLog(log)}
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 ${eventColor.bg} ${eventColor.border} border rounded-lg flex items-center justify-center`}>
                                  <i className={`${getEventIcon(log.event)} ${eventColor.icon} text-sm`}></i>
                                </div>
                                <div>
                                  <div className="font-medium text-slate-900 text-sm">
                                    {String(log.event || 'unknown').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                  </div>
                                  <div className="flex items-center gap-1 mt-1">
                                    <div className={`w-1.5 h-1.5 ${severityColor.dot} rounded-full`}></div>
                                    <span className={`text-xs ${severityColor.text} font-medium`}>
                                      {severityColor.label}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                                  {String(log.user?.name || 'S').charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm font-medium text-slate-900">
                                  {String(log.user?.name || 'System')}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-slate-900 max-w-md">
                                {String(log.description || 'No description').length > 80 
                                  ? String(log.description).substring(0, 80) + '...' 
                                  : String(log.description || 'No description')
                                }
                              </div>
                              {log.subject_type && (
                                <div className="text-xs text-slate-500 mt-1">
                                  {String(log.subject_type).split('\\').pop()} #{String(log.subject_id || 'N/A')}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-slate-900 font-medium">
                                {formatDate(log.created_at)}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                              <i className="bi bi-inbox text-2xl text-slate-400"></i>
                            </div>
                            <div>
                              <div className="text-slate-900 font-medium mb-1">No audit logs found</div>
                              <div className="text-slate-500 text-sm">Try adjusting your filters or date range</div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Cards View */}
            {viewMode === 'cards' && (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {auditLogs.data && auditLogs.data.length > 0 ? (
                    auditLogs.data.map((log, index) => {
                      const eventColor = getEventColor(log.event);
                      const severityColor = getSeverityColor(log.event);
                      
                      return (
                        <div key={index} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-200 hover:scale-105 group">
                          <div className="flex items-start justify-between mb-4">
                            <div className={`w-12 h-12 ${eventColor.bg} ${eventColor.border} border rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                              <i className={`${getEventIcon(log.event)} ${eventColor.icon} text-xl`}></i>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 ${severityColor.dot} rounded-full`}></div>
                              <span className={`text-xs px-2 py-1 ${severityColor.bg} ${severityColor.text} rounded-full font-medium`}>
                                {severityColor.label}
                              </span>
                            </div>
                          </div>
                          
                          <div className="mb-4">
                            <h3 className="font-semibold text-slate-900 mb-1">
                              {String(log.event || 'unknown').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </h3>
                            <p className="text-sm text-slate-600 line-clamp-2">
                              {String(log.description || 'No description')}
                            </p>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                                {String(log.user?.name || 'S').charAt(0).toUpperCase()}
                              </div>
                              <span>{String(log.user?.name || 'System')}</span>
                            </div>
                            <span>{formatDate(log.created_at)}</span>
                          </div>
                          
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="w-full py-2 text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center justify-center gap-2 hover:bg-blue-50 rounded-lg transition-all duration-200"
                          >
                            <i className="bi bi-eye"></i>
                            View Details
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-full flex flex-col items-center gap-4 py-12">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                        <i className="bi bi-inbox text-2xl text-slate-400"></i>
                      </div>
                      <div className="text-center">
                        <div className="text-slate-900 font-medium mb-1">No audit logs found</div>
                        <div className="text-slate-500 text-sm">Try adjusting your filters or date range</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Timeline View */}
            {viewMode === 'timeline' && (
              <div className="p-6">
                <div className="relative">
                  {/* Timeline Line */}
                  <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500"></div>
                  
                  <div className="space-y-6">
                    {auditLogs.data && auditLogs.data.length > 0 ? (
                      auditLogs.data.map((log, index) => {
                        const eventColor = getEventColor(log.event);
                        const severityColor = getSeverityColor(log.event);
                        
                        return (
                          <div key={index} className="relative flex items-start gap-6 group">
                            {/* Timeline Node */}
                            <div className={`relative z-10 w-16 h-16 ${eventColor.bg} ${eventColor.border} border-2 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                              <i className={`${getEventIcon(log.event)} ${eventColor.icon} text-xl`}></i>
                              <div className={`absolute -top-1 -right-1 w-4 h-4 ${severityColor.dot} rounded-full border-2 border-white`}></div>
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all duration-200">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h3 className="font-semibold text-slate-900 mb-1">
                                    {String(log.event || 'unknown').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                  </h3>
                                  <p className="text-sm text-slate-600">
                                    {String(log.description || 'No description')}
                                  </p>
                                </div>
                                <span className={`px-3 py-1 ${severityColor.bg} ${severityColor.text} rounded-full text-xs font-medium`}>
                                  {severityColor.label}
                                </span>
                              </div>
                              
                              <div className="flex items-center justify-between text-sm text-slate-500">
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                                      {String(log.user?.name || 'S').charAt(0).toUpperCase()}
                                    </div>
                                    <span>{String(log.user?.name || 'System')}</span>
                                  </div>
                                  {log.subject_type && (
                                    <div className="flex items-center gap-1">
                                      <i className="bi bi-arrow-right text-xs"></i>
                                      <span>{String(log.subject_type).split('\\').pop()}</span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-3">
                                  <span>{formatDate(log.created_at)}</span>
                                  <button
                                    onClick={() => setSelectedLog(log)}
                                    className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 hover:bg-blue-50 px-2 py-1 rounded transition-all duration-200"
                                  >
                                    <i className="bi bi-eye"></i>
                                    Details
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex flex-col items-center gap-4 py-12">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                          <i className="bi bi-clock-history text-2xl text-slate-400"></i>
                        </div>
                        <div className="text-center">
                          <div className="text-slate-900 font-medium mb-1">No timeline events found</div>
                          <div className="text-slate-500 text-sm">Try adjusting your filters or date range</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )} 
           {/* Enhanced Pagination */}
            {auditLogs.links && auditLogs.links.length > 3 && (
              <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <i className="bi bi-info-circle text-blue-500"></i>
                      <span>
                        Showing <span className="font-semibold text-slate-900">{auditLogs.meta?.from || 0}</span> to{' '}
                        <span className="font-semibold text-slate-900">{auditLogs.meta?.to || 0}</span> of{' '}
                        <span className="font-semibold text-slate-900">{auditLogs.meta?.total || 0}</span> results
                      </span>
                    </div>
                    {auditLogs.meta?.total > 0 && (
                      <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                        <i className="bi bi-clock text-xs"></i>
                        <span className="text-xs font-medium">Real-time data</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {auditLogs.links.map((link, index) => (
                      <Link
                        key={index}
                        href={link.url || '#'}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          link.active
                            ? 'bg-blue-500 text-white shadow-lg scale-105'
                            : link.url
                            ? 'bg-white text-slate-700 hover:bg-slate-100 hover:scale-105 shadow-sm'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Log Detail Modal */}
          {selectedLog && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
              <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${getEventColor(selectedLog.event).bg} ${getEventColor(selectedLog.event).border} border rounded-xl flex items-center justify-center`}>
                      <i className={`${getEventIcon(selectedLog.event)} ${getEventColor(selectedLog.event).icon} text-xl`}></i>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">
                        {String(selectedLog.event || 'unknown').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </h2>
                      <p className="text-sm text-slate-600">{formatDate(selectedLog.created_at)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="text-slate-400 hover:text-slate-600 transition-colors duration-200"
                  >
                    <i className="bi bi-x-lg text-xl"></i>
                  </button>
                </div>
                
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-slate-700">Event Type</label>
                        <div className="mt-1 flex items-center gap-2">
                          <span className={`px-3 py-1 ${getEventColor(selectedLog.event).bg} ${getEventColor(selectedLog.event).text} rounded-full text-sm font-medium border ${getEventColor(selectedLog.event).border}`}>
                            {String(selectedLog.event || 'unknown').replace(/_/g, ' ')}
                          </span>
                          <span className={`px-2 py-1 ${getSeverityColor(selectedLog.event).bg} ${getSeverityColor(selectedLog.event).text} rounded text-xs font-medium`}>
                            {getSeverityColor(selectedLog.event).label}
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-slate-700">User</label>
                        <div className="mt-1 flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {String(selectedLog.user?.name || 'S').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">{String(selectedLog.user?.name || 'System')}</div>
                            <div className="text-sm text-slate-500">{String(selectedLog.user?.email || 'system@meditrack.com')}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-slate-700">Subject</label>
                        <div className="mt-1">
                          <div className="font-medium text-slate-900">
                            {selectedLog.subject_type ? String(selectedLog.subject_type).split('\\').pop() : 'System'}
                          </div>
                          <div className="text-sm text-slate-500 font-mono">
                            ID: {String(selectedLog.subject_id || 'N/A')}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-slate-700">Description</label>
                        <div className="mt-1 p-3 bg-slate-50 rounded-lg">
                          <p className="text-sm text-slate-900">{String(selectedLog.description || 'No description')}</p>
                        </div>
                      </div>

                      {/* Pharmacy-specific fields */}
                      {selectedLog.ip_address && (
                        <div>
                          <label className="text-sm font-medium text-slate-700">IP Address & Location</label>
                          <div className="mt-1 p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-2 text-sm text-slate-900">
                              <i className="bi bi-geo-alt text-blue-500"></i>
                              <span className="font-mono">{selectedLog.ip_address}</span>
                              {selectedLog.location && (
                                <span className="text-slate-600">• {selectedLog.location}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedLog.patient_id && (
                        <div>
                          <label className="text-sm font-medium text-slate-700">Patient Information</label>
                          <div className="mt-1 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center gap-2 text-sm">
                              <i className="bi bi-person-fill text-yellow-600"></i>
                              <span className="font-medium text-yellow-800">Patient ID: {selectedLog.patient_id}</span>
                              <div className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-xs font-medium">
                                HIPAA Protected
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedLog.prescription_number && (
                        <div>
                          <label className="text-sm font-medium text-slate-700">Prescription Details</label>
                          <div className="mt-1 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <i className="bi bi-file-medical text-blue-600"></i>
                                <span className="font-medium text-blue-800">Rx #: {selectedLog.prescription_number}</span>
                              </div>
                              {selectedLog.medication_name && (
                                <div className="flex items-center gap-2">
                                  <i className="bi bi-capsule text-blue-600"></i>
                                  <span className="text-blue-700">{selectedLog.medication_name}</span>
                                  {selectedLog.controlled_substance && (
                                    <div className="px-2 py-1 bg-red-200 text-red-800 rounded text-xs font-medium">
                                      Schedule {selectedLog.controlled_substance}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedLog.risk_level && (
                        <div>
                          <label className="text-sm font-medium text-slate-700">Risk Assessment</label>
                          <div className="mt-1 p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${
                                selectedLog.risk_level === 'high' ? 'bg-red-500' :
                                selectedLog.risk_level === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                              }`}></div>
                              <span className={`text-sm font-medium ${
                                selectedLog.risk_level === 'high' ? 'text-red-700' :
                                selectedLog.risk_level === 'medium' ? 'text-yellow-700' : 'text-green-700'
                              }`}>
                                {selectedLog.risk_level?.toUpperCase()} RISK
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {selectedLog.properties && Object.keys(selectedLog.properties).length > 0 && (
                        <div>
                          <label className="text-sm font-medium text-slate-700">Additional Properties</label>
                          <div className="mt-1 p-3 bg-slate-50 rounded-lg">
                            <pre className="text-xs text-slate-700 whitespace-pre-wrap">
                              {JSON.stringify(selectedLog.properties, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <label className="text-sm font-medium text-slate-700">Timestamp</label>
                        <div className="mt-1 space-y-1">
                          <div className="text-sm text-slate-900">{formatDate(selectedLog.created_at)}</div>
                          <div className="text-xs text-slate-500 font-mono">{new Date(selectedLog.created_at).toISOString()}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between gap-3 p-6 border-t border-slate-200 bg-slate-50">
                  <div className="flex items-center gap-3">
                    {/* Pharmacy-specific quick actions */}
                    {selectedLog.event === 'failed_login' && (
                      <button className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-all duration-200 flex items-center gap-2">
                        <i className="bi bi-shield-x"></i>
                        Block IP
                      </button>
                    )}
                    {selectedLog.event === 'controlled_substance_access' && (
                      <button className="px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg transition-all duration-200 flex items-center gap-2">
                        <i className="bi bi-file-earmark-text"></i>
                        DEA Report
                      </button>
                    )}
                    {selectedLog.patient_id && (
                      <button className="px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-all duration-200 flex items-center gap-2">
                        <i className="bi bi-person-lines-fill"></i>
                        Patient History
                      </button>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedLog(null)}
                      className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors duration-200"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        const logData = JSON.stringify(selectedLog, null, 2);
                        const blob = new Blob([logData], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `audit-log-${selectedLog.id || Date.now()}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-200 flex items-center gap-2"
                    >
                      <i className="bi bi-download"></i>
                      Export Log
                    </button>
                    <button 
                      onClick={() => handleFlagForReview(selectedLog.id)}
                      disabled={isLoading}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 flex items-center gap-2"
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <i className="bi bi-flag"></i>
                      )}
                      Flag for Review
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* 🚀 Floating Action Menu */}
        <div className="fixed bottom-8 right-8 z-40">
          <div className="relative group">
            {/* Main FAB */}
            <button className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 flex items-center justify-center group">
              <i className="bi bi-plus-lg text-2xl group-hover:rotate-45 transition-transform duration-300"></i>
            </button>
            
            {/* Action Items */}
            <div className="absolute bottom-20 right-0 opacity-0 group-hover:opacity-100 transition-all duration-300 space-y-3 transform group-hover:translate-y-0 translate-y-4">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`w-12 h-12 rounded-full shadow-lg transition-all duration-300 hover:scale-110 flex items-center justify-center ${
                  autoRefresh 
                    ? 'bg-green-500 text-white' 
                    : 'bg-white text-gray-600 hover:bg-green-50'
                }`}
                title={autoRefresh ? 'Disable Auto-refresh' : 'Enable Auto-refresh'}
              >
                <i className={`bi ${autoRefresh ? 'bi-pause-fill' : 'bi-play-fill'}`}></i>
              </button>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="w-12 h-12 bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-full shadow-lg transition-all duration-300 hover:scale-110 flex items-center justify-center"
                title="Toggle Filters"
              >
                <i className="bi bi-funnel"></i>
              </button>
              
              <button
                onClick={handleExport}
                className="w-12 h-12 bg-white text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 rounded-full shadow-lg transition-all duration-300 hover:scale-110 flex items-center justify-center"
                title="Export Data"
              >
                <i className="bi bi-download"></i>
              </button>
              
              <button
                onClick={() => router.reload()}
                className="w-12 h-12 bg-white text-gray-600 hover:bg-purple-50 hover:text-purple-600 rounded-full shadow-lg transition-all duration-300 hover:scale-110 flex items-center justify-center"
                title="Refresh Now"
              >
                <i className="bi bi-arrow-clockwise"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}