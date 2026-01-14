'use client';

import { HardDrive } from 'lucide-react';
import { InventoryItem } from '@/app/types/dashboard';

interface InventoryStatusProps {
  inventory: InventoryItem[];
}

export const InventoryStatus: React.FC<InventoryStatusProps> = ({ inventory }) => (
  <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
      <HardDrive className="w-5 h-5 mr-2" />
      Inventory Status
    </h2>
    <div className="space-y-4">
      {inventory.map((item) => (
        <div 
          key={item.id} 
          className="flex items-center justify-between py-2 border-b border-gray-100"
        >
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{item.name}</p>
            <p className="text-xs text-gray-500">Threshold: {item.threshold} units</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-gray-900">{item.stock} units</span>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              item.status === 'good' ? 'bg-green-100 text-green-800' :
              item.status === 'low' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {item.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  </div>
);