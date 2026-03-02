import React, { useState, useEffect } from 'react';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import axios from 'axios';

export default function BatchManagement({ warehouseId, refreshKey }) {
  const [loading, setLoading] = useState(false);
  const [batches, setBatches] = useState([]);

  useEffect(() => {
    fetchBatches();
  }, [warehouseId, refreshKey]);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      // This would be implemented when we add the batch management API
      // const response = await axios.get('/inventory/batches', {
      //     params: { warehouse_id: warehouseId }
      // });
      // setBatches(response.data.batches || []);
      setBatches([]); // Placeholder
    } catch (error) {
      console.error('Error fetching batches:', error);
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
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Batch Management</h3>
        <Button>Add New Batch</Button>
      </div>

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
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
        <h4 className="text-lg font-semibold text-gray-600 mb-2">Batch Management</h4>
        <p className="text-gray-500 mb-4">
          Advanced batch and lot tracking features will be available here.
        </p>
        <div className="space-y-2 text-sm text-gray-600">
          <p>• Create and manage medicine batches</p>
          <p>• Track expiry dates and lot numbers</p>
          <p>• Monitor batch-specific stock levels</p>
          <p>• Handle batch recalls and expiry management</p>
        </div>
      </div>
    </Card>
  );
}
