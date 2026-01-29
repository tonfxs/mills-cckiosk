'use client';

import React, { useMemo, useState } from 'react';
import { defaultKioskSettings, KioskSettings, validateKioskSettings } from '../../types/settings';
import { useKioskSettings } from '../../components/(settings)/useKioskSettings';
import SettingsSection from '../../components/(settings)/SettingsSection';
import SettingsRow from '../../components/(settings)/SettingsRow';   
import TextField from '../../components/(settings)/Textfield';
import NumberField from '../../components/(settings)/NumberField';
import ToggleField from '../../components/(settings)/ToggleField';
import SelectField from '../../components/(settings)/SelectField';  
import PinGate from '../../components/(settings)/PinGate';
import ActionBar from '../../components/(settings)/ActionBar';

const STORAGE_KEY = 'medihub_kiosk_settings_v1';

export default function SettingsPage() {
  const { settings, setSettings, reset, exportJson, importJson } = useKioskSettings<KioskSettings>(
    STORAGE_KEY,
    defaultKioskSettings
  );

  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);

  const errors = useMemo(() => validateKioskSettings(settings), [settings]);
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="space-y-6">
      {/* GENERAL */}
      <SettingsSection title="General" description="Basic kiosk identity and display preferences.">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SettingsRow label="Kiosk Name" hint="Shown on admin screens and logs.">
            <TextField
              value={settings.general.kioskName}
              onChange={(v) =>
                setSettings((prev: KioskSettings) => ({
                  ...prev,
                  general: { ...prev.general, kioskName: v },
                }))
              }
              placeholder="e.g., Mills - Seven Hills"
              error={errors['general.kioskName']}
            />
          </SettingsRow>

          <SettingsRow label="Location" hint="Store/site identifier.">
            <TextField
              value={settings.general.locationLabel}
              onChange={(v) =>
                setSettings((prev: KioskSettings) => ({
                  ...prev,
                  general: { ...prev.general, locationLabel: v },
                }))
              }
              placeholder="e.g., Seven Hills"
              error={errors['general.locationLabel']}
            />
          </SettingsRow>

          <SettingsRow label="Timezone" hint="Used for timestamps on logs.">
            <SelectField
              value={settings.general.timezone}
              onChange={(v) =>
                setSettings((prev: KioskSettings) => ({
                  ...prev,
                  general: { ...prev.general, timezone: v },
                }))
              }
              options={[
                { value: 'Australia/Sydney', label: 'Australia/Sydney' },
                { value: 'Asia/Manila', label: 'Asia/Manila' },
                { value: 'UTC', label: 'UTC' },
              ]}
            />
          </SettingsRow>

          <SettingsRow label="Language" hint="UI language for kiosk screens.">
            <SelectField
              value={settings.general.language}
              onChange={(v) =>
                setSettings((prev: KioskSettings) => ({
                  ...prev,
                  general: { ...prev.general, language: v as KioskSettings['general']['language'] },
                }))
              }
              options={[
                { value: 'en', label: 'English' },
                { value: 'fil', label: 'Filipino' },
              ]}
            />
          </SettingsRow>
        </div>
      </SettingsSection>

      {/* BEHAVIOR */}
      <SettingsSection title="Behavior" description="Idle handling and user flow behavior.">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SettingsRow
            label="Idle Timeout (seconds)"
            hint="When idle, return to Home / attract screen."
          >
            <NumberField
              value={settings.behavior.idleTimeoutSeconds}
              onChange={(n) =>
                setSettings((prev: KioskSettings) => ({
                  ...prev,
                  behavior: { ...prev.behavior, idleTimeoutSeconds: n },
                }))
              }
              min={15}
              max={600}
              step={5}
              error={errors['behavior.idleTimeoutSeconds']}
            />
          </SettingsRow>

          <SettingsRow label="Attract Screen" hint="Show attract screen when idle.">
            <ToggleField
              checked={settings.behavior.enableAttractScreen}
              onChange={(checked) =>
                setSettings((prev: KioskSettings) => ({
                  ...prev,
                  behavior: { ...prev.behavior, enableAttractScreen: checked },
                }))
              }
            />
          </SettingsRow>

          <SettingsRow
            label="Return to Home after Success"
            hint="After submission success, auto-return to main menu."
          >
            <ToggleField
              checked={settings.behavior.returnToHomeAfterSuccess}
              onChange={(checked) =>
                setSettings((prev: KioskSettings) => ({
                  ...prev,
                  behavior: { ...prev.behavior, returnToHomeAfterSuccess: checked },
                }))
              }
            />
          </SettingsRow>

          <SettingsRow label="Sound Effects" hint="Enable UI taps / alerts.">
            <ToggleField
              checked={settings.behavior.enableSounds}
              onChange={(checked) =>
                setSettings((prev: KioskSettings) => ({
                  ...prev,
                  behavior: { ...prev.behavior, enableSounds: checked },
                }))
              }
            />
          </SettingsRow>
        </div>
      </SettingsSection>

      {/* PRIVACY */}
      <SettingsSection
        title="Privacy & Security"
        description="Reduce sensitive data exposure and control admin access."
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SettingsRow label="Mask Sensitive Inputs" hint="Mask payment / ID fields on-screen.">
            <ToggleField
              checked={settings.privacy.maskSensitiveInputs}
              onChange={(checked) =>
                setSettings((prev: KioskSettings) => ({
                  ...prev,
                  privacy: { ...prev.privacy, maskSensitiveInputs: checked },
                }))
              }
            />
          </SettingsRow>

          <SettingsRow label="Auto-clear Form Data" hint="Clear local state after success/cancel.">
            <ToggleField
              checked={settings.privacy.autoClearFormData}
              onChange={(checked) =>
                setSettings((prev: KioskSettings) => ({
                  ...prev,
                  privacy: { ...prev.privacy, autoClearFormData: checked },
                }))
              }
            />
          </SettingsRow>

          <SettingsRow label="Require Admin PIN" hint="Require PIN to edit connectivity/device settings.">
            <ToggleField
              checked={settings.privacy.requireAdminPin}
              onChange={(checked) =>
                setSettings((prev: KioskSettings) => ({
                  ...prev,
                  privacy: { ...prev.privacy, requireAdminPin: checked },
                }))
              }
            />
          </SettingsRow>

          <SettingsRow label="Admin PIN" hint="4–8 digits. Stored locally (hash recommended later).">
            <TextField
              value={settings.privacy.adminPin}
              onChange={(v) =>
                setSettings((prev: KioskSettings) => ({
                  ...prev,
                  privacy: { ...prev.privacy, adminPin: v.replace(/\D/g, '') },
                }))
              }
              placeholder="1234"
              error={errors['privacy.adminPin']}
              inputMode="numeric"
            />
          </SettingsRow>
        </div>
      </SettingsSection>

      {/* ADMIN GATE */}
      {settings.privacy.requireAdminPin && (
        <PinGate
          title="Admin Unlock"
          description="Enter PIN to edit Connectivity & Devices."
          pin={settings.privacy.adminPin}
          onUnlocked={() => setIsAdminUnlocked(true)}
          onLocked={() => setIsAdminUnlocked(false)}
        />
      )}

      {/* CONNECTIVITY */}
      <SettingsSection
        title="Connectivity"
        description="API endpoints and connectivity checks."
        disabled={settings.privacy.requireAdminPin && !isAdminUnlocked}
        disabledHint="Admin unlock required to edit connectivity."
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SettingsRow label="API Base URL" hint="Used by dashboard/kiosk API calls.">
            <TextField
              value={settings.connectivity.apiBaseUrl}
              onChange={(v) =>
                setSettings((prev: KioskSettings) => ({
                  ...prev,
                  connectivity: { ...prev.connectivity, apiBaseUrl: v },
                }))
              }
              placeholder="e.g., https://kiosk-api.mycompany.com"
              error={errors['connectivity.apiBaseUrl']}
            />
          </SettingsRow>

          <SettingsRow label="Google Sheets Logging" hint="This is just a display flag for now.">
            <SelectField
              value={settings.connectivity.sheetsMode}
              onChange={(v) =>
                setSettings((prev: KioskSettings) => ({
                  ...prev,
                  connectivity: {
                    ...prev.connectivity,
                    sheetsMode: v as KioskSettings['connectivity']['sheetsMode'],
                  },
                }))
              }
              options={[
                { value: 'enabled', label: 'Enabled' },
                { value: 'disabled', label: 'Disabled' },
                { value: 'fallback', label: 'Fallback (queue locally)' },
              ]}
            />
          </SettingsRow>

          <SettingsRow
            label="Connectivity Test"
            hint="Basic client-side check. You can wire this to your /health endpoint."
          >
            <ConnectivityTest apiBaseUrl={settings.connectivity.apiBaseUrl} />
          </SettingsRow>
        </div>
      </SettingsSection>

      {/* DEVICES */}
      <SettingsSection
        title="Devices"
        description="Hardware integrations (placeholders until wiring is added)."
        disabled={settings.privacy.requireAdminPin && !isAdminUnlocked}
        disabledHint="Admin unlock required to edit device settings."
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SettingsRow label="Enable Receipt Printing" hint="Show print button on success screen.">
            <ToggleField
              checked={settings.devices.enableReceiptPrinting}
              onChange={(checked) =>
                setSettings((prev: KioskSettings) => ({
                  ...prev,
                  devices: { ...prev.devices, enableReceiptPrinting: checked },
                }))
              }
            />
          </SettingsRow>

          <SettingsRow label="Enable Camera/ID Scan" hint="Allow ID scan workflow (if supported).">
            <ToggleField
              checked={settings.devices.enableCameraIdScan}
              onChange={(checked) =>
                setSettings((prev: KioskSettings) => ({
                  ...prev,
                  devices: { ...prev.devices, enableCameraIdScan: checked },
                }))
              }
            />
          </SettingsRow>
        </div>
      </SettingsSection>

      {/* MAINTENANCE */}
      <SettingsSection title="Maintenance" description="Backup/restore or clear kiosk-local data.">
        <ActionBar
          hasErrors={hasErrors}
          onReset={() => reset()}
          onClearCache={() => {
            try {
              const keep = localStorage.getItem(STORAGE_KEY);
              localStorage.clear();
              if (keep) localStorage.setItem(STORAGE_KEY, keep);
              alert('Cache cleared (settings preserved).');
            } catch {
              alert('Failed to clear cache.');
            }
          }}
          onExport={() => exportJson()}
          onImport={(text) => importJson(text)}
        />
      </SettingsSection>
    </div>
  );
}

function ConnectivityTest({ apiBaseUrl }: { apiBaseUrl: string }) {
  const [status, setStatus] = useState<'idle' | 'checking' | 'ok' | 'fail'>('idle');
  const [message, setMessage] = useState<string>('');

  async function run() {
    setStatus('checking');
    setMessage('');

    try {
      if (!apiBaseUrl) {
        setStatus('fail');
        setMessage('API Base URL is empty.');
        return;
      }

      const url = new URL(apiBaseUrl);
      await fetch(url.toString(), { mode: 'no-cors' });

      setStatus('ok');
      setMessage(
        'Network request attempted. If you have a /health endpoint + CORS, wire it for real checks.'
      );
    } catch (e: any) {
      setStatus('fail');
      setMessage(e?.message ?? 'Connectivity test failed.');
    }
  }

  const pill =
    status === 'ok'
      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
      : status === 'fail'
      ? 'bg-rose-100 text-rose-800 border-rose-200'
      : status === 'checking'
      ? 'bg-amber-100 text-amber-800 border-amber-200'
      : 'bg-slate-100 text-slate-800 border-slate-200';

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={run}
          className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-sm font-semibold text-slate-600"
        >
          Run test
        </button>

        <span className={`px-3 py-1 rounded-full border text-xs font-semibold ${pill}`}>
          {status.toUpperCase()}
        </span>
      </div>

      {message ? <p className="text-xs text-slate-600">{message}</p> : null}
    </div>
  );
}
