import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Package,
  DollarSign,
  BarChart3,
  FileSpreadsheet,
  Filter,
  RefreshCw,
} from 'lucide-react';

export default function ReportsIndex({ statistics }) {
  const [loading, setLoading] = useState({});
  const [reportData, setReportData] = useState({});
  const [filters, setFilters] = useState({
    sales: {
      date_from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      date_to: new Date().toISOString().split('T')[0],
    },
    expiry: {
      days_ahead: 90,
    },
    stock: {
      stock_status: '',
    },
  });

  const reportTypes = [
    {
      key: 'sales',
      title: 'Sales Report',
      description: 'Comprehensive sales analysis with trends and customer insights',
      icon: TrendingUp,
      color: 'bg-blue-500',
      stats: [
        { label: 'Sales This Month', value: statistics.total_sales_this_month, format: 'number' },
      ],
    },
    {
      key: 'expiry',
      title: 'Expiry Report',
      description: 'Medicine expiry tracking and value at risk analysis',
      icon: AlertTriangle,
      color: 'bg-red-500',
      stats: [
        { label: 'Expiring Soon', value: statistics.medicines_expiring_soon, format: 'number' },
      ],
    },
    {
      key: 'stock',
      title: 'Stock Report',
      description: 'Complete inventory analysis and stock level monitoring',
      icon: Package,
      color: 'bg-green-500',
      stats: [
        { label: 'Low Stock Items', value: statistics.low_stock_medicines, format: 'number' },
        { label: 'Out of Stock', value: statistics.out_of_stock_medicines, format: 'number' },
        { label: 'Inventory Value', value: statistics.total_inventory_value, format: 'currency' },
      ],
    },
  ];

  const formatValue = (value, format) => {
    switch (format) {
      case 'currency':
        return `UGX ${Number(value).toLocaleString()}`;
      case 'number':
        return new Intl.NumberFormat('en-US').format(value);
      default:
        return value;
    }
  };

  const generateReport = async type => {
    setLoading(prev => ({ ...prev, [type]: true }));

    try {
      const response = await fetch(`/reports/${type}?${new URLSearchParams(filters[type])}`);
      const data = await response.json();
      setReportData(prev => ({ ...prev, [type]: data }));
    } catch (error) {
      console.error(`Error generating ${type} report:`, String(error.message || error));
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  const exportReport = (type, format) => {
    const params = new URLSearchParams(filters[type]);
    const url = `/reports/${type}/export-${format}?${params}`;
    window.open(url, '_blank');
  };

  const updateFilter = (reportType, key, value) => {
    setFilters(prev => ({
      ...prev,
      [reportType]: {
        ...prev[reportType],
        [key]: value,
      },
    }));
  };

  const exportDashboardReport = () => {
    window.open('/reports/dashboard/export-pdf', '_blank');
  };

  return (
    <AuthenticatedLayout
      header={
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-xl text-gray-800 leading-tight">
            Reports & Data Export
          </h2>
          <Button onClick={exportDashboardReport} className="bg-purple-600 hover:bg-purple-700">
            <Download className="w-4 h-4 mr-2" />
            Export Dashboard PDF
          </Button>
        </div>
      }
    >
      <Head title="Reports" />

      <div className="py-6">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
          {/* Overview Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Sales This Month</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatValue(statistics.total_sales_this_month, 'number')}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                    <p className="text-2xl font-bold text-red-600">
                      {formatValue(statistics.medicines_expiring_soon, 'number')}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {formatValue(statistics.low_stock_medicines, 'number')}
                    </p>
                  </div>
                  <Package className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Inventory Value</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatValue(statistics.total_inventory_value, 'currency')}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Report Types */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {reportTypes.map(report => (
              <Card key={report.key} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${report.color}`}>
                        <report.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{report.title}</CardTitle>
                        <p className="text-sm text-gray-600">{report.description}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Report Statistics */}
                  <div className="grid grid-cols-1 gap-2">
                    {report.stats.map((stat, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{stat.label}:</span>
                        <Badge variant="secondary">{formatValue(stat.value, stat.format)}</Badge>
                      </div>
                    ))}
                  </div>

                  {/* Filters */}
                  <div className="space-y-3 border-t pt-4">
                    <div className="flex items-center space-x-2">
                      <Filter className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Filters</span>
                    </div>

                    {report.key === 'sales' && (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">From Date</label>
                            <input
                              type="date"
                              value={filters.sales.date_from}
                              onChange={e => updateFilter('sales', 'date_from', e.target.value)}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">To Date</label>
                            <input
                              type="date"
                              value={filters.sales.date_to}
                              onChange={e => updateFilter('sales', 'date_to', e.target.value)}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {report.key === 'expiry' && (
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Days Ahead</label>
                        <select
                          value={filters.expiry.days_ahead}
                          onChange={e => updateFilter('expiry', 'days_ahead', e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="30">30 days</option>
                          <option value="60">60 days</option>
                          <option value="90">90 days</option>
                          <option value="180">180 days</option>
                          <option value="365">1 year</option>
                        </select>
                      </div>
                    )}

                    {report.key === 'stock' && (
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Stock Status</label>
                        <select
                          value={filters.stock.stock_status}
                          onChange={e => updateFilter('stock', 'stock_status', e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">All Items</option>
                          <option value="low_stock">Low Stock</option>
                          <option value="out_of_stock">Out of Stock</option>
                          <option value="overstock">Overstock</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 border-t pt-4">
                    <Button
                      onClick={() => generateReport(report.key)}
                      disabled={loading[report.key]}
                      className="w-full"
                      size="sm"
                    >
                      {loading[report.key] ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Generate Report
                        </>
                      )}
                    </Button>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={() => exportReport(report.key, 'pdf')}
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        PDF
                      </Button>
                      <Button
                        onClick={() => exportReport(report.key, 'excel')}
                        variant="outline"
                        size="sm"
                        className="text-green-600 border-green-600 hover:bg-green-50"
                      >
                        <FileSpreadsheet className="w-4 h-4 mr-1" />
                        Excel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Report Results */}
          {Object.keys(reportData).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Report Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.entries(reportData).map(([type, data]) => (
                    <div key={type} className="border rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-4 capitalize">
                        {type} Report Summary
                      </h3>

                      {type === 'sales' && data.summary && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {formatValue(data.summary.total_sales, 'number')}
                            </div>
                            <div className="text-sm text-gray-600">Total Sales</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {formatValue(data.summary.total_revenue, 'currency')}
                            </div>
                            <div className="text-sm text-gray-600">Total Revenue</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">
                              {formatValue(data.summary.average_sale_amount, 'currency')}
                            </div>
                            <div className="text-sm text-gray-600">Average Sale</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">
                              {formatValue(data.summary.total_quantity_sold, 'number')}
                            </div>
                            <div className="text-sm text-gray-600">Items Sold</div>
                          </div>
                        </div>
                      )}

                      {type === 'expiry' && data.summary && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">
                              {formatValue(data.summary.critical_count, 'number')}
                            </div>
                            <div className="text-sm text-gray-600">Critical (≤7 days)</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-600">
                              {formatValue(data.summary.warning_count, 'number')}
                            </div>
                            <div className="text-sm text-gray-600">Warning (≤30 days)</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {formatValue(data.summary.notice_count, 'number')}
                            </div>
                            <div className="text-sm text-gray-600">Notice (≤90 days)</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">
                              {formatValue(data.summary.total_value_at_risk, 'currency')}
                            </div>
                            <div className="text-sm text-gray-600">Value at Risk</div>
                          </div>
                        </div>
                      )}

                      {type === 'stock' && data.summary && (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">
                              {formatValue(data.summary.out_of_stock_count, 'number')}
                            </div>
                            <div className="text-sm text-gray-600">Out of Stock</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-600">
                              {formatValue(data.summary.low_stock_count, 'number')}
                            </div>
                            <div className="text-sm text-gray-600">Low Stock</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {formatValue(data.summary.adequate_stock_count, 'number')}
                            </div>
                            <div className="text-sm text-gray-600">Adequate Stock</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {formatValue(data.summary.overstock_count, 'number')}
                            </div>
                            <div className="text-sm text-gray-600">Overstock</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {formatValue(data.summary.total_inventory_value, 'currency')}
                            </div>
                            <div className="text-sm text-gray-600">Total Value</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
