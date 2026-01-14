'use client';

import { Activity, Battery, Wifi } from 'lucide-react';
import { SystemMetric } from './SystemMetric';
import { SystemHealth as SystemHealthType } from '@/app/types/dashboard';

interface SystemHealthProps {
  systemHealth: SystemHealthType;
}

export const SystemHealth: React.FC<SystemHealthProps> = ({ systemHealth }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
      <Activity className="w-5 h-5 mr-2" />
      System Health
    </h2>
    <SystemMetric label="CPU Usage" value={systemHealth.cpu} />
    <SystemMetric label="Memory" value={systemHealth.memory} />
    <SystemMetric label="Storage" value={systemHealth.storage} />
    <div className="flex items-center justify-between pt-4 border-t">
      <div className="flex items-center">
        <Battery className="w-5 h-5 text-green-600 mr-2" />
        <span className="text-sm text-gray-700">Battery</span>
      </div>
      <span className="text-sm font-semibold text-gray-900">{systemHealth.battery}%</span>
    </div>
    <div className="flex items-center justify-between pt-2">
      <div className="flex items-center">
        <Wifi className="w-5 h-5 text-green-600 mr-2" />
        <span className="text-sm text-gray-700">Connection</span>
      </div>
      <span className="text-sm font-semibold text-gray-900 capitalize">
        {systemHealth.connectivity}
      </span>
    </div>
  </div>
);
