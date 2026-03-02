import React from 'react';
import { Button } from '@/Components/ui/button';

export default function WarehouseSelector({ warehouses, selected, onSelect }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray-700">Warehouse:</span>
      <select
        value={selected || ''}
        onChange={e => onSelect(e.target.value || null)}
        className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">All Warehouses</option>
        {warehouses?.map(warehouse => (
          <option key={warehouse.id} value={warehouse.id}>
            {warehouse.name} ({warehouse.code})
          </option>
        ))}
      </select>
    </div>
  );
}
