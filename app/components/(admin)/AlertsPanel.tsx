'use client';

import { AlertTriangle } from 'lucide-react';
import { Alert } from '@/app/types/dashboard';

interface AlertsPanelProps {
  alerts: Alert[];
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
      <AlertTriangle className="w-5 h-5 mr-2" />
      Alerts
    </h2>
    <div className="space-y-3">
      {alerts.map((alert) => (
        <div 
          key={alert.id} 
          className={`p-3 rounded-lg ${
            alert.type === 'warning' 
              ? 'bg-orange-50 border border-orange-200' 
              : 'bg-blue-50 border border-blue-200'
          }`}
        >
          <div className="flex items-start">
            <AlertTriangle className={`w-4 h-4 mt-0.5 mr-2 ${
              alert.type === 'warning' ? 'text-orange-600' : 'text-blue-600'
            }`} />
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                alert.type === 'warning' ? 'text-orange-900' : 'text-blue-900'
              }`}>
                {alert.message}
              </p>
              <p className="text-xs text-gray-500 mt-1">{alert.time}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);