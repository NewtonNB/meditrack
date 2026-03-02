import React, { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PerformanceMonitor = ({ className = '' }) => {
  const [metrics, setMetrics] = useState({
    responseTime: [],
    memoryUsage: [],
    cpuUsage: [],
    activeUsers: 0,
    requestsPerMinute: 0,
    errorRate: 0,
    uptime: '99.9%',
  });
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isVisible) {
      fetchMetrics();
      const interval = setInterval(fetchMetrics, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isVisible]);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      // Simulate performance metrics (in real app, this would come from your monitoring service)
      const mockMetrics = {
        responseTime: generateTimeSeriesData(20, 50, 300),
        memoryUsage: generateTimeSeriesData(20, 40, 80),
        cpuUsage: generateTimeSeriesData(20, 20, 70),
        activeUsers: Math.floor(Math.random() * 50) + 10,
        requestsPerMinute: Math.floor(Math.random() * 100) + 50,
        errorRate: (Math.random() * 2).toFixed(2),
        uptime: '99.9%',
      };
      
      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateTimeSeriesData = (points, min, max) => {
    const data = [];
    const now = new Date();
    
    for (let i = points - 1; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60000); // 1 minute intervals
      data.push({
        time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        value: Math.floor(Math.random() * (max - min)) + min,
      });
    }
    
    return data;
  };

  const getStatusColor = (value, thresholds) => {
    if (value >= thresholds.danger) return 'text-red-600';
    if (value >= thresholds.warning) return 'text-yellow-600';
    return 'text-green-600';
  };

  const MetricCard = ({ title, value, unit, threshold, icon, description }) => {
    const statusColor = threshold ? getStatusColor(value, threshold) : 'text-blue-600';
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className={`text-2xl font-bold ${statusColor}`}>
              {value}{unit}
            </p>
            {description && (
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            )}
          </div>
          <div className="text-2xl">{icon}</div>
        </div>
      </div>
    );
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className={`fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-40 ${className}`}
        title="Show Performance Monitor"
      >
        📊
      </button>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-40 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-lg">📊</span>
          <h3 className="font-semibold text-gray-900">Performance Monitor</h3>
          {loading && (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
          )}
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            title="Active Users"
            value={metrics.activeUsers}
            unit=""
            icon="👥"
            description="Currently online"
          />
          
          <MetricCard
            title="Requests/Min"
            value={metrics.requestsPerMinute}
            unit=""
            icon="🔄"
            description="API requests"
          />
          
          <MetricCard
            title="Error Rate"
            value={metrics.errorRate}
            unit="%"
            threshold={{ warning: 1, danger: 5 }}
            icon="⚠️"
            description="Last hour"
          />
          
          <MetricCard
            title="Uptime"
            value={metrics.uptime}
            unit=""
            icon="⏱️"
            description="Last 30 days"
          />
        </div>

        {/* Response Time Chart */}
        <div className="bg-gray-50 rounded-lg p-3">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Response Time (ms)</h4>
          <ResponsiveContainer width="100%" height={80}>
            <LineChart data={metrics.responseTime}>
              <Line
                type="monotone"
                dataKey="value"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={false}
              />
              <XAxis dataKey="time" hide />
              <YAxis hide />
              <Tooltip
                labelFormatter={(label) => `Time: ${label}`}
                formatter={(value) => [`${value}ms`, 'Response Time']}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Memory Usage Chart */}
        <div className="bg-gray-50 rounded-lg p-3">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Memory Usage (%)</h4>
          <ResponsiveContainer width="100%" height={80}>
            <AreaChart data={metrics.memoryUsage}>
              <defs>
                <linearGradient id="memoryGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke="#10B981"
                fillOpacity={1}
                fill="url(#memoryGradient)"
              />
              <XAxis dataKey="time" hide />
              <YAxis hide />
              <Tooltip
                labelFormatter={(label) => `Time: ${label}`}
                formatter={(value) => [`${value}%`, 'Memory Usage']}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* CPU Usage Chart */}
        <div className="bg-gray-50 rounded-lg p-3">
          <h4 className="text-sm font-medium text-gray-700 mb-2">CPU Usage (%)</h4>
          <ResponsiveContainer width="100%" height={80}>
            <AreaChart data={metrics.cpuUsage}>
              <defs>
                <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke="#F59E0B"
                fillOpacity={1}
                fill="url(#cpuGradient)"
              />
              <XAxis dataKey="time" hide />
              <YAxis hide />
              <Tooltip
                labelFormatter={(label) => `Time: ${label}`}
                formatter={(value) => [`${value}%`, 'CPU Usage']}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* System Status */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-800">System Status: Healthy</span>
          </div>
          <p className="text-xs text-green-600 mt-1">
            All systems operational. Last updated: {new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMonitor;