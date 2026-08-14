/**
 * Ambient leftovers that cannot be expressed as JSDoc on a concrete export.
 * Do not declare `truex-shared/...` modules here — consumers resolve the `.js` files.
 */

interface Window {
    AmazonAdvertising?: {
        getAdvertisingId(success: (id: string) => void, error: (message: string) => void): void;
        getLimitAdTrackingPreference(success: (limit: boolean) => void, error: (message: string) => void): void;
    };
    androidApp?: { getAndroidDetails(): string };
    fireTVApp?: { getAndroidDetails(): string };
    PalmSystem?: unknown;
    tizen?: {
        application?: { getCurrentApplication(): { exit(): void } };
        tvinputdevice?: { registerKey(keyName: string): void };
        inputdevice?: { registerKey(keyName: string): void };
    };
    VIZIO?: { isSmartCastDevice?: boolean; exitApplication(): void };
    webOS?: { deviceInfo(callback: (device: { modelNameAscii?: string; version?: string }) => void): void };
    Windows?: {
        System?: {
            Profile?: {
                AnalyticsInfo?: {
                    versionInfo?: { deviceFamily?: string; deviceFamilyVersion?: string };
                };
            };
        };
    };
    $badger?: unknown;
}

interface Navigator {
    gamepadInputEmulation?: string;
}

declare module '*.scss' {
    const content: string;
    export default content;
}
