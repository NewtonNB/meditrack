import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { Alert } from '@/Components/ui/alert';
import StockOverview from '@/Components/Inventory/StockOverview';
import BatchManagement from '@/Components/Inventory/BatchManagement';
import LowStockAlerts from '@/Components/Inventory/LowStockAlerts';
import ExpiringBatches from '@/Components/Inventory/ExpiringBatches';
import StockMovements from '@/Components/Inventory/StockMovements';
import WarehouseSelector from '@/Components/Inventory/WarehouseSelector';

export default function InventoryDashboard({
  auth,
  warehouses,
  summary,
  lowStockItems,
  expiringBatches,
  recentMovements,
}) {
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshData = () => {
    setRefreshKey(prev => prev + 1);
    window.location.reload();
  };

  return (
    <AuthenticatedLayout
      user={auth.user}
      header={
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-xl text-gray-800 leading-tight">
            Inventory Management
          </h2>
          <div className="flex gap-2">
            <WarehouseSelector
              warehouses={warehouses}
              selected={selectedWarehouse}
              onSelect={setSelectedWarehouse}
            />
            <Button onClick={refreshData} variant="outline">
              Refresh
            </Button>
          </div>
        </div>
      }
    >
      <Head title="Inventory Management" />

      <div className="py-6">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Items</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {summary.total_items?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <svg
                    className="w-6 h-6 text-blue-600"
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
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${summary.total_value?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                    />
                  </svg>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                  <p className="text-2xl font-bold text-red-600">{summary.low_stock_items || 0}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <svg
                    className="w-6 h-6 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Expiring Batches</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {summary.expiring_batches || 0}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <svg
                    className="w-6 h-6 text-orange-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="batches">Batches</TabsTrigger>
              <TabsTrigger value="low-stock">Low Stock</TabsTrigger>
              <TabsTrigger value="expiring">Expiring</TabsTrigger>
              <TabsTrigger value="movements">Movements</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <StockOverview
                summary={summary}
                warehouseId={selectedWarehouse}
                refreshKey={refreshKey}
              />
            </TabsContent>

            <TabsContent value="batches" className="space-y-4">
              <BatchManagement warehouseId={selectedWarehouse} refreshKey={refreshKey} />
            </TabsContent>

            <TabsContent value="low-stock" className="space-y-4">
              <LowStockAlerts
                items={lowStockItems}
                warehouseId={selectedWarehouse}
                refreshKey={refreshKey}
              />
            </TabsContent>

            <TabsContent value="expiring" className="space-y-4">
              <ExpiringBatches
                batches={expiringBatches}
                warehouseId={selectedWarehouse}
                refreshKey={refreshKey}
              />
            </TabsContent>

            <TabsContent value="movements" className="space-y-4">
              <StockMovements
                movements={recentMovements}
                warehouseId={selectedWarehouse}
                refreshKey={refreshKey}
              />
            </TabsContent>
          </Tabs>

          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button className="h-20 flex flex-col items-center justify-center">
                <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Add Stock
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                  />
                </svg>
                Transfer Stock
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                Stock Audit
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                Reports
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
