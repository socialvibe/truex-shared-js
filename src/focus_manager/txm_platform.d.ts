export const keyCodes: {
    space: number;
    tab: number;
    enter: number;
    esc: number;
    del: number;
    backspace: number;
    zero: number;
    one: number;
    two: number;
    three: number;
    four: number;
    five: number;
    six: number;
    seven: number;
    eight: number;
    nine: number;
    A: number;
    B: number;
    C: number;
    D: number;
    E: number;
    F: number;
    S: number;
    L: number;
    M: number;
    O: number;
    P: number;
    Q: number;
    W: number;
    X: number;
    Y: number;
    Z: number;
    leftArrow: number;
    rightArrow: number;
    upArrow: number;
    downArrow: number;
};

export class TXMPlatform {
    constructor(userAgentOverride?: string, currentWindow?: Window);

    name: string;
    model: string;
    version: string;
    isUnknown: boolean;
    isIOS: boolean;
    isTVOS: boolean;
    isIPad: boolean;
    isIPhone: boolean;
    isVizio: boolean;
    isLG: boolean;
    isTizen: boolean;
    isComcast: boolean;
    isPS4: boolean;
    isPS5: boolean;
    isAndroidMobile: boolean;
    isAndroidTV: boolean;
    isFireTV: boolean;
    isKepler: boolean;
    isXboxOne: boolean;
    isNintendoSwitch: boolean;
    isSlowDevice: boolean;
    useScrollTop: boolean;
    useWindowScroll: boolean;
    supportsMouse: boolean;
    supportsTouch: boolean;
    supportsGyro: boolean;
    supportsInitialVideoSeek: boolean;
    supportsHttpImagesWithHttps: boolean;
    useHistoryBackActions: boolean;
    userAgent: string;
    supportsUserAdvertisingId: boolean;

    readonly isAndroid: boolean;
    readonly isAndroidOrFireTV: boolean;
    readonly isHandheld: boolean;
    readonly isTablet: boolean;
    readonly isCTV: boolean;
    readonly isConsole: boolean;
    readonly useContentScroll: boolean;
    readonly screenSize: { width: number, height: number };
    readonly keyCodes: typeof keyCodes;

    getInputAction(keyCode: number): string | undefined;
    applyInputKeyMap(actionKeyCodes: { [action: string]: number | number[] }): void;
    describeError(err: any, showStack?: boolean): string;
    describeErrorWithStack(error: any): string;
    exitApp(): void;
    getUserAdvertisingId(): Promise<string | undefined>;
    getFireTVAdvertisingId(): Promise<string | undefined>;
}

interface Window {
    AmazonAdvertising: any;
    androidApp: any;
    fireTVApp: any;
    PalmSystem: any;
    tizen: any;
    VIZIO: any;
    webOS: any;
}