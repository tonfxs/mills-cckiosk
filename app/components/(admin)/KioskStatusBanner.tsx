'use client';

import { Wifi } from 'lucide-react';

interface KioskStatusBannerProps {
  status: 'online' | 'offline';
}

export const KioskStatusBanner: React.FC<KioskStatusBannerProps> = ({ status }) => (
  <div className={`mb-6 p-4 rounded-lg ${
    status === 'online' 
      ? 'bg-green-50 border border-green-200' 
      : 'bg-red-50 border border-red-200'
  }`}>
    <div className="flex items-center">
      <Wifi className={`w-5 h-5 mr-2 ${
        status === 'online' ? 'text-green-600' : 'text-red-600'
      }`} />
      <span className={`font-medium ${
        status === 'online' ? 'text-green-900' : 'text-red-900'
      }`}>
        Kiosk Status: {status.toUpperCase()}
      </span>
    </div>
  </div>
);