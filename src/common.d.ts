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
    webOS?: {
        deviceInfo(callback: (device: WebOSDeviceInfo) => void): void;
    };

    // UWP, WinRT
    Windows?: {
        System?: {
            Profile?: {
                AnalyticsInfo?: {
                    versionInfo?: {
                        deviceFamily: string;
                        deviceFamilyVersion: string
                    };
                };
            };
        };
    };
    $badger?: unknown;

    truex_qc_callback?: (result: QuantcastSegmentsResult) => void,
    truex_exelate_callback?: (result: ExelateSegmentsResult) => void,
}

/** JSONP payload from Quantcast `api/segments.json`. */
type QuantcastSegmentsResult = {
    segments: { id: string }[];
};

/** JSONP payload from Exelate `t_cb` callback. */
type ExelateSegmentsResult = {
    segments?: string[];
};

/**
 * @see {@link https://webostv.developer.lge.com/develop/references/webostvjs-webos#deviceinfo}
 */
type WebOSDeviceInfo = {
    modelName: string;
    version: string;
    versionMajor: number;
    versionMinor: number;
    versionDot: number;
    sdkVersion: string;
    screenWidth: number;
    screenHeight: number;
    uhd: boolean;
    uhd8K: boolean;
    oled?: boolean;
    ddrSize?: string;
    hdr10: boolean;
    dolbyVision: boolean;
    dolbyAtmos: boolean;
    brandName: string;
    manufacturer: string;
    mainboardMaker?: string;
    platformBizType: string;
    tuner: boolean;

    // this property doesn't exist in the official docs
    // but for some reason?!, we check this property
    modelNameAscii?: string;
};

interface Navigator {
    gamepadInputEmulation?: string;
}

declare module '*.scss' {
    const content: string;
    export default content;
}
