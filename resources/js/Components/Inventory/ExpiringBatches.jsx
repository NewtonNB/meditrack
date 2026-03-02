import React, { useState, useEffect } from 'react';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Alert } from '@/Components/ui/alert';
import axios from 'axios';

export default function ExpiringBatches({ batches: initialBatches, warehouseId, refreshKey }) {
  const [loading, setLoading] = useState(false);
  const [batches, setBatches] = useState(initialBatches || []);

  useEffect(() => {
    fetchExpiringBatches();
  }, [warehouseId, refreshKey]);

  const fetchExpiringBatches = async () => {
    setLoading(true);
    try {
      const params = warehouseId ? { warehouse_id: warehouseId } : {};
      const response = await axios.get('/inventory/expiring-batches', { params });
      setBatches(response.data.expiring_batches || []);
    } catch (error) {
      console.error('Error fetching expiring batches:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = daysToExpiry => {
    if (daysToExpiry < 0) return 'destructive';
    if (daysToExpiry <= 7) return 'destructive';
    if (daysToExpiry <= 30) return 'warning';
    return 'secondary';
  };

  const getRiskText = daysToExpiry => {
    if (daysToExpiry < 0) return 'Expired';
    if (daysToExpiry <= 7) return 'Critical';
    if (daysToExpiry <= 30) return 'Warning';
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

  if (!batches || batches.length === 0) {
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
          <h4 className="font-semibold">No Expiring Batches</h4>
          <p className="text-sm text-gray-600">All batches are within safe expiry periods.</p>
        </div>
      </Alert>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Expiring Batches</h3>
        <Badge variant="warning">{batches.length} batches</Badge>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Medicine</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Batch Number</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Expiry Date</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Stock</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((batch, index) => {
              const daysToExpiry = batch.days_to_expiry || 0;
              return (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium text-gray-900">
                        {batch.batch?.medicine?.name || 'Unknown Medicine'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {batch.batch?.medicine?.brand || ''}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-sm">{batch.batch?.batch_number || 'N/A'}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-gray-700">{batch.batch?.expiry_date || 'N/A'}</span>
                    <div className="text-sm text-gray-500">
                      {daysToExpiry >= 0
                        ? `${daysToExpiry} days`
                        : `${Math.abs(daysToExpiry)} days ago`}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold">{batch.total_stock || 0}</span>
                    <span className="text-sm text-gray-500 ml-1">units</span>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={getRiskColor(daysToExpiry)}>{getRiskText(daysToExpiry)}</Badge>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        Mark Expired
                      </Button>
                      <Button size="sm" variant="ghost">
                        Details
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-between items-center">
        <div className="text-sm text-gray-600">Showing {batches.length} expiring batches</div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchExpiringBatches}>
            Refresh
          </Button>
          <Button>Export Report</Button>
        </div>
      </div>
    </Card>
  );
}
