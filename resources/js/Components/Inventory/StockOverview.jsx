import React, { useState, useEffect } from 'react';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import axios from 'axios';

export default function StockOverview({ summary, warehouseId, refreshKey }) {
  const [loading, setLoading] = useState(false);
  const [stockData, setStockData] = useState(summary);

  useEffect(() => {
    fetchStockData();
  }, [warehouseId, refreshKey]);

  const fetchStockData = async () => {
    setLoading(true);
    try {
      const params = warehouseId ? { warehouse_id: warehouseId } : {};
      const response = await axios.get('/inventory/summary', { params });
      setStockData(response.data);
    } catch (error) {
      console.error('Error fetching stock data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Stock Status */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Stock Status</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">In Stock</span>
            <Badge variant="success">
              {stockData?.total_items - stockData?.out_of_stock_items || 0}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Low Stock</span>
            <Badge variant="warning">{stockData?.low_stock_items || 0}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Out of Stock</span>
            <Badge variant="destructive">{stockData?.out_of_stock_items || 0}</Badge>
          </div>
        </div>
      </Card>

      {/* Value Breakdown */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Inventory Value</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Value</span>
            <span className="font-semibold">${stockData?.total_value?.toLocaleString() || 0}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Average per Item</span>
            <span className="font-semibold">
              $
              {stockData?.total_items > 0
                ? (stockData.total_value / stockData.total_items).toFixed(2)
                : '0.00'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Expiring Value</span>
            <span className="font-semibold text-orange-600">
              ${stockData?.expiring_value?.toLocaleString() || 0}
            </span>
          </div>
        </div>
      </Card>

      {/* Quick Stats */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total SKUs</span>
            <span className="font-semibold">{stockData?.total_items || 0}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Active Batches</span>
            <span className="font-semibold">{stockData?.active_batches || 0}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Expiring Soon</span>
            <Badge variant="warning">{stockData?.expiring_batches || 0}</Badge>
          </div>
        </div>
      </Card>
    </div>
  );
}
