import React, { useState, useEffect } from 'react';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import axios from 'axios';

export default function StockMovements({ movements: initialMovements, warehouseId, refreshKey }) {
  const [loading, setLoading] = useState(false);
  const [movements, setMovements] = useState(initialMovements || []);

  useEffect(() => {
    fetchStockMovements();
  }, [warehouseId, refreshKey]);

  const fetchStockMovements = async () => {
    setLoading(true);
    try {
      const params = warehouseId ? { warehouse_id: warehouseId } : {};
      const response = await axios.get('/inventory/movements', { params });
      setMovements(response.data.movements || []);
    } catch (error) {
      console.error('Error fetching stock movements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMovementColor = type => {
    const colors = {
      in: 'success',
      out: 'destructive',
      transfer: 'secondary',
      adjustment: 'warning',
      expired: 'destructive',
      damaged: 'destructive',
    };
    return colors[type] || 'secondary';
  };

  const getMovementIcon = type => {
    const icons = {
      in: '↗️',
      out: '↘️',
      transfer: '↔️',
      adjustment: '⚖️',
      expired: '⏰',
      damaged: '⚠️',
    };
    return icons[type] || '📦';
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="h-4 bg-gray-200 rounded w-1/6"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/6"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/6"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Stock Movements</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Filter
          </Button>
          <Button variant="outline" size="sm">
            Export
          </Button>
        </div>
      </div>

      {!movements || movements.length === 0 ? (
        <div className="text-center py-8">
          <svg
            className="w-12 h-12 text-gray-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p className="text-gray-500">No stock movements found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Medicine</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Quantity</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Warehouse</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">User</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Notes</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((movement, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="text-sm">
                      {new Date(movement.created_at).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(movement.created_at).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium text-gray-900">
                        {movement.medicine?.name || 'Unknown Medicine'}
                      </div>
                      <div className="text-sm text-gray-500">{movement.medicine?.brand || ''}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={getMovementColor(movement.movement_type)}>
                      {getMovementIcon(movement.movement_type)}{' '}
                      {movement.movement_type?.toUpperCase() || 'UNKNOWN'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`font-semibold ${
                        movement.movement_type === 'in'
                          ? 'text-green-600'
                          : movement.movement_type === 'out'
                            ? 'text-red-600'
                            : 'text-gray-600'
                      }`}
                    >
                      {movement.movement_type === 'in'
                        ? '+'
                        : movement.movement_type === 'out'
                          ? '-'
                          : ''}
                      {movement.quantity || 0}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">
                      {movement.unit_type || 'units'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-gray-700">{movement.warehouse?.name || 'Unknown'}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-gray-700">{movement.creator?.name || 'System'}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-600">
                      {movement.notes || movement.note || '-'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 flex justify-between items-center">
        <div className="text-sm text-gray-600">Showing {movements.length} movements</div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchStockMovements}>
            Refresh
          </Button>
          <Button variant="outline">Load More</Button>
        </div>
      </div>
    </Card>
  );
}
