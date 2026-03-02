import React, { useState, useEffect } from 'react';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Alert } from '@/Components/ui/alert';
import axios from 'axios';

export default function LowStockAlerts({ items: initialItems, warehouseId, refreshKey }) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState(initialItems || []);

  useEffect(() => {
    fetchLowStockItems();
  }, [warehouseId, refreshKey]);

  const fetchLowStockItems = async () => {
    setLoading(true);
    try {
      const params = warehouseId ? { warehouse_id: warehouseId } : {};
      const response = await axios.get('/inventory/low-stock', { params });
      setItems(response.data.low_stock_items || []);
    } catch (error) {
      console.error('Error fetching low stock items:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (currentStock, reorderPoint) => {
    const percentage = (currentStock / reorderPoint) * 100;
    if (percentage <= 25) return 'destructive';
    if (percentage <= 50) return 'warning';
    return 'secondary';
  };

  const getUrgencyText = (currentStock, reorderPoint) => {
    const percentage = (currentStock / reorderPoint) * 100;
    if (percentage <= 25) return 'Critical';
    if (percentage <= 50) return 'Low';
    return 'Monitor';
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/6"></div>
              <div className="h-4 bg-gray-200 rounded w-1/6"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (!items || items.length === 0) {
    return (
      <Alert>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div>
          <h4 className="font-semibold">No Low Stock Items</h4>
          <p className="text-sm text-gray-600">All items are above their reorder points.</p>
        </div>
      </Alert>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Low Stock Alerts</h3>
        <Badge variant="destructive">{items.length} items</Badge>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Medicine</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Current Stock</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Reorder Point</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Warehouse</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div>
                    <div className="font-medium text-gray-900">
                      {item.medicine?.name || 'Unknown Medicine'}
                    </div>
                    <div className="text-sm text-gray-500">{item.medicine?.brand || ''}</div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="font-semibold text-red-600">{item.quantity || 0}</span>
                  <span className="text-sm text-gray-500 ml-1">{item.unit_type || 'units'}</span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-gray-700">
                    {item.reorder_point || item.medicine?.reorder_point || 0}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-gray-700">{item.warehouse?.name || 'Unknown'}</span>
                </td>
                <td className="py-3 px-4">
                  <Badge
                    variant={getUrgencyColor(
                      item.quantity,
                      item.reorder_point || item.medicine?.reorder_point || 1
                    )}
                  >
                    {getUrgencyText(
                      item.quantity,
                      item.reorder_point || item.medicine?.reorder_point || 1
                    )}
                  </Badge>
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      Reorder
                    </Button>
                    <Button size="sm" variant="ghost">
                      Details
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-between items-center">
        <div className="text-sm text-gray-600">Showing {items.length} low stock items</div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchLowStockItems}>
            Refresh
          </Button>
          <Button>Generate Reorder Report</Button>
        </div>
      </div>
    </Card>
  );
}
