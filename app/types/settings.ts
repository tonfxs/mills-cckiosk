export type KioskSettings = {
  general: {
    kioskName: string;
    locationLabel: string;
    timezone: string;
    language: 'en' | 'fil';
  };
  behavior: {
    idleTimeoutSeconds: number;
    enableAttractScreen: boolean;
    returnToHomeAfterSuccess: boolean;
    enableSounds: boolean;
  };
  privacy: {
    maskSensitiveInputs: boolean;
    autoClearFormData: boolean;
    requireAdminPin: boolean;
    adminPin: string; // digits
  };
  connectivity: {
    apiBaseUrl: string;
    sheetsMode: 'enabled' | 'disabled' | 'fallback';
  };
  devices: {
    enableReceiptPrinting: boolean;
    enableCameraIdScan: boolean;
  };
};

export const defaultKioskSettings: KioskSettings = {
  general: {
    kioskName: 'Mills - Seven Hills',
    locationLabel: 'Seven Hills',
    timezone: 'Australia/Sydney',
    language: 'en',
  },
  behavior: {
    idleTimeoutSeconds: 90,
    enableAttractScreen: true,
    returnToHomeAfterSuccess: true,
    enableSounds: true,
  },
  privacy: {
    maskSensitiveInputs: true,
    autoClearFormData: true,
    requireAdminPin: true,
    adminPin: '1234',
  },
  connectivity: {
    apiBaseUrl: '',
    sheetsMode: 'enabled',
  },
  devices: {
    enableReceiptPrinting: false,
    enableCameraIdScan: false,
  },
};

export function validateKioskSettings(s: KioskSettings): Record<string, string> {
  const e: Record<string, string> = {};

  if (!s.general.kioskName?.trim()) e['general.kioskName'] = 'Kiosk name is required.';
  if (!s.general.locationLabel?.trim()) e['general.locationLabel'] = 'Location is required.';

  if (!Number.isFinite(s.behavior.idleTimeoutSeconds)) {
    e['behavior.idleTimeoutSeconds'] = 'Idle timeout must be a number.';
  } else if (s.behavior.idleTimeoutSeconds < 15 || s.behavior.idleTimeoutSeconds > 600) {
    e['behavior.idleTimeoutSeconds'] = 'Idle timeout must be between 15 and 600 seconds.';
  }

  if (s.privacy.requireAdminPin) {
    const pin = (s.privacy.adminPin ?? '').trim();
    if (!/^\d{4,8}$/.test(pin)) e['privacy.adminPin'] = 'PIN must be 4–8 digits.';
  }

  if (s.connectivity.apiBaseUrl) {
    try {
      // Will throw if invalid
      new URL(s.connectivity.apiBaseUrl);
    } catch {
      e['connectivity.apiBaseUrl'] = 'Must be a valid URL (include https://).';
    }
  }

  return e;
}
