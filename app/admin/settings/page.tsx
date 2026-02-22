'use client';

import { ReactNode } from 'react';
import DashboardHeader from '@/app/components/(admin)/DashboardHeader';
import SectionShell from '@/app/components/(admin)/SectionShell';
import SettingsShell from '@/app/components/(settings)/SettingsShell';
import SettingsSection from '@/app/components/(settings)/SettingsSection';

interface SectionShellProps {
  title: string;
  subtitle: string;
  description?: string;
  right?: ReactNode;
  children: ReactNode;
}

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
    <DashboardHeader
      title="Settings"
      subtitle="Configure kiosk behavior, privacy, connectivity, and device options."
      query=""
      onQueryChange={() => {}}
      autoRefresh={false}
      onToggleAutoRefresh={() => {}}
      onRefresh={() => {}}
    />

      <div className="px-8 pb-10 py-6">
        <SectionShell title="Shopfront Kiosk Admin Settings" subtitle="Manage kiosk data, archive records, and Google Sheets storage.">
          <SettingsShell />
        </SectionShell>
      </div>
    </div>
  );
}
