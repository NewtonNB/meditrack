import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Link, router } from '@inertiajs/react';
import {
  AlertTriangle,
  Package,
  Clock,
  TrendingUp,
  ShoppingCart,
  Calendar,
  DollarSign,
  Zap,
  RefreshCw,
  ArrowRight,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

export default function AutomationWidget() {
  const [automationData, setAutomationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchAutomationData = async () => {
    try {
      // Use a more robust URL construction
      const url = window.route ? route('automation.data') : '/automation/data';
      console.log('🤖 Fetching automation data from:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🤖 Automation data received:', JSON.stringify(data, null, 2));
      
      setAutomationData(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('🤖 Failed to fetch automation data:', error);
      setAutomationData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAutomationData();

    // Refresh data every 5 minutes
    const interval = setInterval(fetchAutomationData, 300000);
    return () => clearInterval(interval);
  }, []);

  const getUrgencyColor = level => {
    switch (level) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getUrgencyTextColor = level => {
    switch (level) {
      case 'critical':
        return 'text-red-600';
      case 'high':
        return 'text-orange-600';
      case 'medium':
        return 'text-yellow-600';
      default:
        return 'text-blue-600';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="w-5 h-5 mr-2 text-blue-600" />
            Smart Automation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Loading automation insights...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!automationData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="w-5 h-5 mr-2 text-blue-600" />
            Smart Automation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Unable to load automation data</p>
            <p className="text-xs text-gray-400 mt-2">Check console for details</p>
            <Button onClick={fetchAutomationData} variant="outline" size="sm" className="mt-2">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Safe destructuring with defaults
  const { 
    reorder_suggestions = { total: 0, critical: 0, high: 0, estimated_cost: 0 }, 
    expiry_reminders = { total: 0, critical: 0, high: 0 }, 
    quick_actions = [] 
  } = automationData || {};

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      {quick_actions && quick_actions.length > 0 && (
        <Card className="border border-red-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-red-100 bg-red-50/50">
            <CardTitle className="flex items-center text-red-700 text-base">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
              Urgent Actions Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
             {quick_actions.slice(0, 3).map((action, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium text-slate-800">{String(action.title || 'Action Required')}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-red-100 text-red-700">
                      {String(action.priority || 'high')}
                    </span>
                  </div>
                </div>
                <Link href={window.route ? route(action.route) : `/${action.route.replace('.', '/')}`}>
                  <Button size="sm" variant="outline" className="text-slate-600 border-slate-200 hover:bg-slate-50">
                    {String(action.action || 'View')}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Main Automation Widget */}
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="pb-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-slate-800 text-lg">
              <Zap className="w-5 h-5 mr-2 text-blue-600" />
              Smart Automation
            </CardTitle>
            <div className="flex items-center space-x-3">
              <Button onClick={fetchAutomationData} variant="outline" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900 border-slate-200 bg-white">
                <RefreshCw className="w-4 h-4" />
              </Button>
              {lastUpdated && (
                <span className="text-xs text-slate-500">
                  Updated {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Reorder Suggestions Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/50">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
                <div className="flex items-center">
                  <Package className="w-5 h-5 text-slate-500 mr-2" />
                  <h4 className="font-medium text-slate-800">Reorder Suggestions</h4>
                </div>
                <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-xs font-bold">{Number(reorder_suggestions.total || 0)}</span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm items-center">
                  <span className="text-slate-500 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500"></div> Critical:</span>
                  <span className="font-semibold text-slate-700">{Number(reorder_suggestions.critical || 0)}</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-slate-500 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-orange-500"></div> High Priority:</span>
                  <span className="font-semibold text-slate-700">{Number(reorder_suggestions.high || 0)}</span>
                </div>
                <div className="flex justify-between text-sm items-center pt-2 border-t border-slate-100">
                  <span className="text-slate-500">Est. Cost:</span>
                  <span className="font-bold text-slate-800">
                    UGX {Number(reorder_suggestions.estimated_cost || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <Link href={window.route ? route('automation.reorder-suggestions') : '/automation/reorder-suggestions'} className="mt-auto block">
                <Button size="sm" variant="outline" className="w-full bg-white text-slate-600 border-slate-200 hover:bg-slate-50">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  View All Suggestions
                </Button>
              </Link>
            </div>

            {/* Expiry Reminders Summary */}
            <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/50">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-slate-500 mr-2" />
                  <h4 className="font-medium text-slate-800">Expiry Alerts</h4>
                </div>
                <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-xs font-bold">{Number(expiry_reminders.total || 0)}</span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm items-center">
                  <span className="text-slate-500 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500"></div> Critical (≤7 days):</span>
                  <span className="font-semibold text-slate-700">{Number(expiry_reminders.critical || 0)}</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-slate-500 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-orange-500"></div> High (≤30 days):</span>
                  <span className="font-semibold text-slate-700">{Number(expiry_reminders.high || 0)}</span>
                </div>
                <div className="flex justify-between text-sm items-center pt-2 border-t border-slate-100">
                  <span className="text-slate-500">Potential Loss:</span>
                  <span className="font-bold text-slate-800">
                    UGX {Number(expiry_reminders.potential_loss || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <Link href={window.route ? route('medicines.index') : '/medicines'} className="mt-auto block">
                <Button size="sm" variant="outline" className="w-full bg-white text-slate-600 border-slate-200 hover:bg-slate-50">
                  <Calendar className="w-4 h-4 mr-2" />
                  View All Alerts
                </Button>
              </Link>
            </div>
          </div>

          {/* Automation Benefits */}
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-800 mb-3 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Automation Benefits
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                <span>Prevents stockouts</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                <span>Reduces waste from expiry</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                <span>Optimizes inventory costs</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{Number(reorder_suggestions.total || 0)}</div>
              <div className="text-xs text-gray-500">Reorder Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{Number(expiry_reminders.total || 0)}</div>
              <div className="text-xs text-gray-500">Expiring Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                UGX {((reorder_suggestions.estimated_cost || 0) / 1000).toFixed(1)}K
              </div>
              <div className="text-xs text-gray-500">Reorder Value</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                UGX {((expiry_reminders.potential_loss || 0) / 1000).toFixed(1)}K
              </div>
              <div className="text-xs text-gray-500">Risk Value</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
