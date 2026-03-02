import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import {
  Package,
  AlertTriangle,
  TrendingUp,
  Clock,
  DollarSign,
  User,
  Phone,
  Mail,
  ShoppingCart,
  CheckCircle,
  X,
  Calendar,
  BarChart3,
  Filter,
  Download,
} from 'lucide-react';

export default function ReorderSuggestions({ suggestions, summary }) {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('urgency_score');
  const [actionedItems, setActionedItems] = useState(new Set());

  const { post } = useForm();

  const filteredSuggestions = suggestions.filter(suggestion => {
    if (filter === 'all') return true;
    return suggestion.urgency_level === filter;
  });

  const sortedSuggestions = [...filteredSuggestions].sort((a, b) => {
    switch (sortBy) {
      case 'urgency_score':
        return b.urgency_score - a.urgency_score;
      case 'days_until_stockout':
        return a.days_until_stockout - b.days_until_stockout;
      case 'estimated_cost':
        return b.estimated_cost - a.estimated_cost;
      case 'medicine_name':
        return a.medicine_name.localeCompare(b.medicine_name);
      default:
        return 0;
    }
  });

  const getUrgencyColor = level => {
    switch (level) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getUrgencyIcon = level => {
    switch (level) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4" />;
      case 'high':
        return <TrendingUp className="w-4 h-4" />;
      case 'medium':
        return <Clock className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const handleAction = async (medicineId, action) => {
    try {
      await fetch(route('automation.reorder.action', medicineId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
        },
        body: JSON.stringify({ action }),
      });

      setActionedItems(prev => new Set([...prev, medicineId]));
    } catch (error) {
      console.error('Failed to update suggestion:', error);
    }
  };

  const generatePurchaseOrder = async medicineId => {
    try {
      const response = await fetch(route('automation.generate-po', medicineId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
        },
      });

      const data = await response.json();

      if (data.success) {
        // Here you would typically redirect to purchase order creation
        // or open a modal with the purchase order details
        alert('Purchase order data generated successfully!');
        console.log('Purchase Order:', data.purchase_order);
      }
    } catch (error) {
      console.error('Failed to generate purchase order:', error);
    }
  };

  return (
    <AuthenticatedLayout
      header={
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-semibold text-xl text-gray-800 leading-tight">
              Smart Reorder Suggestions
            </h2>
            <p className="text-gray-600 mt-1">
              AI-powered recommendations based on sales patterns and stock levels
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      }
    >
      <Head title="Reorder Suggestions" />

      <div className="py-6">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Suggestions</p>
                    <p className="text-2xl font-bold">{summary.total}</p>
                  </div>
                  <Package className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Critical Items</p>
                    <p className="text-2xl font-bold text-red-600">{summary.critical}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">High Priority</p>
                    <p className="text-2xl font-bold text-orange-600">{summary.high}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Est. Total Cost</p>
                    <p className="text-2xl font-bold text-green-600">
                      UGX {summary.total_estimated_cost?.toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Controls */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium">Filter:</span>
                    <select
                      value={filter}
                      onChange={e => setFilter(e.target.value)}
                      className="border border-gray-300 rounded px-3 py-1 text-sm"
                    >
                      <option value="all">All Levels</option>
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium">Sort by:</span>
                    <select
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value)}
                      className="border border-gray-300 rounded px-3 py-1 text-sm"
                    >
                      <option value="urgency_score">Urgency Score</option>
                      <option value="days_until_stockout">Days Until Stockout</option>
                      <option value="estimated_cost">Estimated Cost</option>
                      <option value="medicine_name">Medicine Name</option>
                    </select>
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  Showing {sortedSuggestions.length} of {suggestions.length} suggestions
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Suggestions List */}
          <div className="space-y-4">
            {sortedSuggestions.map(suggestion => (
              <Card
                key={suggestion.id}
                className={`${actionedItems.has(suggestion.id) ? 'opacity-60' : ''}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-semibold">{suggestion.medicine_name}</h3>
                        <Badge className={getUrgencyColor(suggestion.urgency_level)}>
                          {getUrgencyIcon(suggestion.urgency_level)}
                          <span className="ml-1">{String(suggestion?.urgency_level || 'normal').toUpperCase()}</span>
                        </Badge>
                        <span className="text-sm text-gray-500">#{suggestion.medicine_code}</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                        {/* Stock Information */}
                        <div>
                          <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                            <Package className="w-4 h-4 mr-2" />
                            Stock Information
                          </h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Current Stock:</span>
                              <span className="font-medium">{suggestion.current_stock} units</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Reorder Level:</span>
                              <span className="font-medium">{suggestion.reorder_level} units</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Suggested Quantity:</span>
                              <span className="font-medium text-blue-600">
                                {suggestion.suggested_quantity} units
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Sales Analytics */}
                        <div>
                          <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Sales Analytics
                          </h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Daily Sales Rate:</span>
                              <span className="font-medium">
                                {suggestion.sales_velocity} units/day
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Days Until Stockout:</span>
                              <span
                                className={`font-medium ${suggestion.days_until_stockout <= 7 ? 'text-red-600' : 'text-gray-900'}`}
                              >
                                {suggestion.days_until_stockout} days
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Urgency Score:</span>
                              <span className="font-medium">{suggestion.urgency_score}/100</span>
                            </div>
                          </div>
                        </div>

                        {/* Supplier Information */}
                        <div>
                          <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                            <User className="w-4 h-4 mr-2" />
                            Preferred Supplier
                          </h4>
                          {suggestion.preferred_supplier ? (
                            <div className="space-y-1 text-sm">
                              <div className="font-medium">
                                {String(suggestion?.preferred_supplier?.name || 'Unknown Supplier')}
                              </div>
                              <div className="flex items-center text-gray-600">
                                <Phone className="w-3 h-3 mr-1" />
                                {String(suggestion?.preferred_supplier?.contact || 'No contact')}
                              </div>
                              <div className="flex items-center text-gray-600">
                                <Mail className="w-3 h-3 mr-1" />
                                {String(suggestion?.preferred_supplier?.email || 'No email')}
                              </div>
                              <div className="text-xs text-green-600">
                                Reliability: {Number(suggestion?.preferred_supplier?.reliability_score || 0)}%
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500">No preferred supplier</div>
                          )}
                        </div>
                      </div>

                      {/* Additional Information */}
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Reason:</span>
                            <p className="text-gray-700 mt-1">{suggestion.reason}</p>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>Estimated Cost:</span>
                              <span className="font-medium">
                                UGX {suggestion.estimated_cost?.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Last Purchase:</span>
                              <span>{suggestion.last_purchase_date || 'Never'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Lead Time:</span>
                              <span>{suggestion.average_lead_time} days</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="ml-6 flex flex-col space-y-2">
                      {!actionedItems.has(suggestion.id) ? (
                        <>
                          <Button
                            onClick={() => generatePurchaseOrder(suggestion.id)}
                            className="whitespace-nowrap"
                          >
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Create PO
                          </Button>
                          <Button
                            onClick={() => handleAction(suggestion.id, 'ordered')}
                            variant="outline"
                            size="sm"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Mark Ordered
                          </Button>
                          <Button
                            onClick={() => handleAction(suggestion.id, 'ignored')}
                            variant="outline"
                            size="sm"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Ignore
                          </Button>
                        </>
                      ) : (
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          <span className="text-sm">Actioned</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {sortedSuggestions.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No suggestions found</h3>
                <p className="text-gray-500">
                  {filter === 'all'
                    ? 'All medicines are currently well-stocked!'
                    : `No ${filter} priority suggestions at this time.`}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
