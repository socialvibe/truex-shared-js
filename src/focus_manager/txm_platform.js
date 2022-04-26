import { inputActions } from './txm_input_actions';
import { ScriptLoader } from "../utils/loaders";

/**
 * Standard ASCII key codes
 */
export const keyCodes = {
    space: 32,
    tab: 9,
    enter: 13,
    esc: 27,
    del: 127,
    backspace: 8,
    zero: 48,
    one: 49,
    two: 50,
    three: 51,
    four: 52,
    five: 53,
    six: 54,
    seven: 55,
    eight: 56,
    nine: 57,
    A: 65,
    B: 66,
    C: 67,
    D: 68,
    E: 69,
    F: 70,
    S: 83,
    L: 76,
    M: 77,
    O: 79,
    P: 80,
    Q: 81,
    W: 87,
    X: 88,
    Y: 89,
    Z: 90,
    leftArrow: 37,
    rightArrow: 39,
    upArrow: 38,
    downArrow: 40,
};

/**
 * Provides platform detection and capability support, as well as key event code mapping to virtual input actions.
 */
export class TXMPlatform {

    /**
     * Allow user agent overrides for testing. Defaults to standard one if not provided.
     * @param userAgentOverride
     */
    constructor(userAgentOverride) {
        this.name = "Unknown";
        this.model = "Unknown";
        this.version = "Unknown";
        this.isUnknown = false;

        this.isIOS = false;
        this.isTVOS = false;
        this.isIPad = false;
        this.isIPhone = false;

        this.isVizio = false;
        this.isLG = false;
        this.isTizen = false;
        this.isComcast = false;
        this.isPS4 = false;
        this.isPS5 = false;

        this.isAndroidMobile = false;
        this.isAndroidTV = false;
        this.isFireTV = false;

        this.isXboxOne = false;
        this.isNintendoSwitch = false;

        this.isSlowDevice = false;

        // Scroll support:

        // If true (e.g. for LG WebOS), scrolling only works via scrollTop changes on a top level div.
        this.useScrollTop = false;

        // Otherwise we rely on window.scrollTo, but that only works if we are not scaled.
        this.useWindowScroll = true;

        this.supportsMouse = false;
        this.supportsTouch = (navigator.maxTouchPoints || 'ontouchstart' in document.documentElement);

        this.supportsGyro = false; // on all platforms except perhaps for the Switch?

        // Indicates if the platform player can start playback directly at a specified time position.
        // If false then one needs to start playback first before seeking works.
        this.supportsInitialVideoSeek = true;

        // Most platforms allow http: image GETs when running under https:, even the latest Chrome.
        // AndroidTV/FireTV does not however.
        this.supportsHttpImagesWithHttps = true;

        // If true, use history.back() and popstate processing to process back actions,
        // as fielding the back key events directly can cause problems.
        // E.g. on FireTV the history back action still happens even if the 27 key code is fielded and propagation
        // halted, thereby causing double back action processing.
        this.useHistoryBackActions = false;

        this._inputKeyMap = {};

        let userAgent = userAgentOverride || window.navigator.userAgent;
        this.userAgent = userAgent;

        this.supportsUserAdvertisingId = false;

        this._configure(userAgent);
    }

    get isAndroid() { return this.isAndroidMobile || this.isAndroidTV }
    get isAndroidOrFireTV() { return this.isAndroidTV || this.isFireTV }

    get isHandheld() { return this.isIPhone || this.isAndroidMobile && /Mobile/.test(this.userAgent) }
    get isTablet() { return this.isIPad || this.isAndroidMobile && !this.isHandheld }

    get isCTV() { return this.isLG || this.isVizio || this.isTizen || this.isAndroidTV || this.isFireTV || this.isComcast }
    get isConsole() { return this.isXboxOne || this.isPS4 || this.isPS5 || this.isNintendoSwitch }


    // Otherwise the fallback scroll approach is to absolutely position a page's content div within its parent.
    get useContentScroll() {
        return !this.useWindowScroll && !this.useScrollTop
            // Tizen had auto-scroll bars showing that we want to avoid.
            // TODO: verify if this is still the case
            || this.isTizen;
    }

    get screenSize() {
        var root = document.documentElement;
        var w = root.clientWidth;
        var h = root.clientHeight;
        return {width: w, height: h};
    }

    get keyCodes() {
        return keyCodes;
    }

    /**
     * Maps a key event's keycode into a platform independent input action.
     */
    getInputAction(keyCode) {
        const action = this._inputKeyMap[keyCode];
        // for exploring new keystrokes
        //console.log(`getInputAction: key code: ${keyCode} action: ${action}`);
        return action;
    }

    applyInputKeyMap(actionKeyCodes) {
        for (const action in actionKeyCodes) {
            const actionCodes = actionKeyCodes[action];
            if (Array.isArray(actionCodes)) {
                actionCodes.forEach(keyCode => {
                    this._inputKeyMap[keyCode] = action;
                });
            } else {
                // Assume a single key code.
                this._inputKeyMap[actionCodes] = action;
            }
        }
    }

    /**
     * Tolerates platform specific error description differences to show reasonbly readable error messages.
     * @return {String}
     */
    describeError(err, showStack) {
        if (typeof err == "string" || typeof(err) == "number" || !err) return err;

        var msg;
        if (err instanceof Error || err.stack) {
            msg = err.toString();

        } else if (err.message) {
            msg = err.message;

        } else if (err.type && err.target) {
            // Ignore JS events, they don't seem to be helpful.

        } else if (Object.prototype.toString !== err.toString) {
            msg = err.toString();

        } else {
            msg = JSON.stringify(err);
        }

        if (!msg && err.code) msg = "errCode: " + err.code;

        if (err.stack && showStack) {
            // The stack does not include the message on some platforms. Ensure it is present.
            if (err.message && err.stack.indexOf(err.message) >= 0) {
                // Message is already in the stack trace.
                msg = err.stack;
            } else {
                msg += "\n" + err.stack;
            }
        }

        if (!msg) msg = "unknown error";
        return msg;
    }

    describeErrorWithStack(error) {
        return this.describeError(error, true);
    }

    exitApp() {
        if (this.isTizen && window.tizen) {
            window.tizen.application.getCurrentApplication().exit();
            return;
        }

        if (this.isVizio && window.VIZIO && window.VIZIO.isSmartCastDevice) {
            // we're using a smart cast TV do their exit call
            window.VIZIO.exitApplication();
            return;
        }

        // Fall back to something reasonable.
        try {
            window.close();
        } catch (err) {}
        try {
            window.location = "about:blank";
        } catch (err) {}
    }

    _configure(userAgent) {
        const self = this;
        const actionKeyCodes = {};

        // Detect which platform we are running on.
        if (window.PalmSystem) {
            configureForLgWebOs();

        } else if (/Tizen/i.test(userAgent)) {
            configureForTizen();

        } else if (/Vizio/i.test(userAgent) || /Smartcast/i.test(userAgent) || /Conjure/i.test(userAgent)
            // Older smartcasts were more "pure" chromecast devices:
            || /CrKey/.test(userAgent)) {
            configureForVizio();

        } else if (/PlayStation 4/.test(userAgent)) {
            configureForPS4();

        } else if (/PlayStation 5/.test(userAgent)) {
            configureForPS5();

        // } else if (/Nintendo/.test(userAgent)) {
        //     configureForNintendoSwitch();

        } else if (/Xbox/.test(userAgent)) {
            configureForXboxOne();

        } else if (/Android/.test(userAgent)) {
            if (/AFT/.test(userAgent)) {
                configureForFireTV();
            } else {
                configureForAndroid();
            }

        } else if (/Linux/.test(userAgent) && (window.$badger || !window.localStorage)) {
            // "Real" comcast apps uses the badger lib.
            // When running running from test apps like Skyline this will not have been set up, so
            // we use a hack for detecting the known comcast limitation. If we ever encounter another platform
            // that also is missing localStorage (unlikely), then we will have to distinguish between them then.
            configureForComcast();

        } else {
            configureForUnknownPlatform();
        }

        // Establish the direct key code to input action mapping.
        self._inputKeyMap = {};
        self.applyInputKeyMap(actionKeyCodes);
        return;

        function configureForLgWebOs() {
            self.isLG = true;
            self.name = "LG";

            self.supportsMouse = true;

            var webOS = window.webOS;
            if (webOS) {
                webOS.deviceInfo(device => {
                    self.model = device.modelNameAscii;
                    self.version = device.version;
                });
            }

            // use scrollTop changes instead of window.scrollTo() on LG
            self.useWindowScroll = false;

            // This ensure the scroll wheel on remote control to work.
            // This may cause the lower resolution to have scrollbar.
            self.useScrollTop = true;

            // LG uses history back actions by default instead of the explicit back key event,
            // although keystroke events can be enabled by adding `disableBackHistoryAPI: true;`
            // to the `appinfo.json` web app's file.
            //
            // see https://webostv.developer.lge.com/develop/app-developer-guide/back-button/
            self.useHistoryBackActions = true;

            addDefaultKeyMap();
            actionKeyCodes[inputActions.back] = 461;

            actionKeyCodes[inputActions.playPause] = [415, 19]; // map both play and pause to a single play/pause toggle
            actionKeyCodes[inputActions.fastForward] = 417;
            actionKeyCodes[inputActions.rewind] = 412;
            actionKeyCodes[inputActions.stop] = 413;

            actionKeyCodes[inputActions.red] = 403;
            actionKeyCodes[inputActions.green] = 404;
            actionKeyCodes[inputActions.yellow] = 405;
            actionKeyCodes[inputActions.blue] = 406;
        }

        function configureForTizen() {
            self.isTizen = true;
            self.name = "Tizen";

            self.supportsMouse = true;

            let versionMatch = userAgent.match(/Tizen ([^\s)]+)\)/);
            if (versionMatch) self.version = versionMatch[1];

            let versionValue = parseFloat(self.version);
            if (versionValue >= 3.0) {
                // Starting in 2017 at v3.0, each version is a new model year.
                let modelYear = Math.floor(2017 - 3 + versionValue);
                self.model = `${modelYear}`;
            } else if (versionValue >= 2.4) {
                self.model = "2016";
            } else if (versionValue < 2.4) {
                self.model = "2015";
            }

            addDefaultKeyMap();
            actionKeyCodes[inputActions.select] = [keyCodes.enter, /* soft keyboard done: */ 65376];
            actionKeyCodes[inputActions.back].push(10009); // Tizen remote, but also support USB keyboard,
            actionKeyCodes[inputActions.back].push(65385); // soft keyboard cancel

            // TODO: is tizen api available or not?
            var inputdevice = window.tizen && (tizen.tvinputdevice || tizen.inputdevice);
            if (inputdevice) {
                // Register keys to enable them.
                var keyNames = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "Exit",
                    "MediaFastForward", "MediaPause", "MediaPlay", "MediaPlayPause", "MediaRewind",
                    "MediaStop", "MediaTrackNext", "MediaTrackPrevious", "Search", "Extra", "Caption"
                ];
                keyNames.forEach(keyName => {
                    inputdevice.registerKey(keyName);
                });
            }

            actionKeyCodes[inputActions.exit] = 10182;
            actionKeyCodes[inputActions.playPause] = [415, 19]; // play and pause
            actionKeyCodes[inputActions.fastForward] = 417;
            actionKeyCodes[inputActions.rewind] = 412;
            actionKeyCodes[inputActions.stop] = 413;
            actionKeyCodes[inputActions.nextTrack] = 418;
            actionKeyCodes[inputActions.search] = 10225;
            actionKeyCodes[inputActions.extra] = 10253;
            actionKeyCodes[inputActions.red] = 403;
            actionKeyCodes[inputActions.green] = 404;
            actionKeyCodes[inputActions.yellow] = 405;
            actionKeyCodes[inputActions.blue] = 406;
        }

        function configureForVizio() {
            self.isVizio = true;
            self.name = "Vizio";

            const modelMatch = userAgent.match(/Model\/([^\s)]+)/);
            self.model = modelMatch && modelMatch[1] || "Unknown";

            const versionMatch = userAgent.match(/FW\/([^\s)]+)/);
            self.version = versionMatch && versionMatch[1] || "?.?.?";

            self.isSlowDevice = !!self.model.match(/^D24/); // D-series has bad performance

            // disable to ensure scrollbars are always hidden in auto-scale situations.
            self.useWindowScroll = false;

            addDefaultKeyMap();
            actionKeyCodes[inputActions.back] = [keyCodes.backspace, keyCodes.del];
            actionKeyCodes[inputActions.exit] = [keyCodes.esc];
            actionKeyCodes[inputActions.playPause] = [415, 19]; // play and pause
            actionKeyCodes[inputActions.fastForward] = 417;
            actionKeyCodes[inputActions.rewind] = 412;
            actionKeyCodes[inputActions.stop] = 413;
            actionKeyCodes[inputActions.nextTrack] = [418];
        }

        function configureForComcast() {
            self.isComcast = true;
            self.name = "Comcast";
            self.model = self.name;

            addDefaultKeyMap();

            actionKeyCodes[inputActions.playPause] = 179;
            actionKeyCodes[inputActions.rewind] = 227;
            actionKeyCodes[inputActions.fastForward] = 228;
        }

        function configureForPS4() {
            self.isPS4 = true;
            self.name = "PS4";
            self.model = self.name;

            let versionMatch = userAgent.match(/(WebMAF\/v([0-9]+\.)+[0-9]+)/);
            if (!versionMatch) {
                // Not found, fallback to older user agent pattern.
                versionMatch = userAgent.match(/PlayStation 4 ([^\s)]+)\)/);
            }
            if (versionMatch) self.version = versionMatch[1];

            self.useWindowScroll = false;

            self.supportsInitialVideoSeek = false;

            addPlayStationKeymap();
        }

        function configureForPS5() {
            self.isPS5 = true;
            self.name = "PS5";
            self.model = self.name;

            let versionMatch = userAgent.match(/PlayStation 5\/([^\s)]+)\)/);
            if (versionMatch) self.version = versionMatch[1];

            addPlayStationKeymap();
        }

        function addPlayStationKeymap() {
            addDefaultKeyMap();
            actionKeyCodes[inputActions.buttonSquare] = 32;
            actionKeyCodes[inputActions.buttonTriangle] = 112;

            actionKeyCodes[inputActions.leftShoulder1] = 116; // L1
            actionKeyCodes[inputActions.rightShoulder1] = 117; // R1

            actionKeyCodes[inputActions.leftShoulder2] = 118; // L2
            actionKeyCodes[inputActions.rightShoulder2] = 119; // R2

            actionKeyCodes[inputActions.leftStick] = 120; // L3
            actionKeyCodes[inputActions.rightStick] = 121; // R3

            // BD Remote & CEC only
            actionKeyCodes[inputActions.back] = [keyCodes.esc, keyCodes.backspace];
            actionKeyCodes[inputActions.menu] = 36;
            actionKeyCodes[inputActions.green] = 133; // used for test automation by stb-tester
            actionKeyCodes[inputActions.prevTrack] = 122;
            actionKeyCodes[inputActions.nextTrack] = 123;
            actionKeyCodes[inputActions.skipForward] = 124;
            actionKeyCodes[inputActions.skipBackward] = 125;
            actionKeyCodes[inputActions.fastForward] = 126;
            actionKeyCodes[inputActions.rewind] = 127; // del on keyboard, rewind key on remote
            actionKeyCodes[inputActions.playPause] = [128, 130];
            actionKeyCodes[inputActions.stop] = 129; // stop button acts the same as the pause button on a ps4 tv remote
        }

        function configureForXboxOne() {
            self.isXboxOne = true;
            self.name = "XboxOne";

            self.model = "Windows.Xbox";
            self.version = "Unknown";

            self.supportsMouse = true;
            self.supportsTouch = true;

            // The Windows API is available only to UWP web apps, not regular web pages (or web views within a C# UWP app).
            // We want to tolerate both ways of making web apps for the Xbox.
            var winApi = window.Windows;
            if (winApi) {
                var system = Windows.System;
                if (system) {
                    var profile = system.Profile;
                    if (profile) {
                        var analytics = profile.AnalyticsInfo;
                        if (analytics) {
                            var versionInfo = analytics.versionInfo;
                            if (versionInfo) {
                                self.model = versionInfo.deviceFamily;
                                self.version = versionInfo.deviceFamilyVersion;
                            }
                        }
                    }
                }
            }

            // Change navigation mode from 'mouse' to 'keyboard' (which supports Xbox Controllers)
            window.navigator.gamepadInputEmulation = "keyboard";

            addDefaultKeyMap();
            addTestingKeyCodes();
            actionKeyCodes[inputActions.menu] = 207;

            actionKeyCodes[inputActions.buttonY] = 198;
            actionKeyCodes[inputActions.buttonX] = 197;

            actionKeyCodes[inputActions.leftShoulder1] = 200;  // LB
            actionKeyCodes[inputActions.rightShoulder1] = 199;  // RB

            actionKeyCodes[inputActions.leftShoulder2] = 201; // LT
            actionKeyCodes[inputActions.rightShoulder2] = 202; // RT

            actionKeyCodes[inputActions.leftStick] = 209; // L3
            actionKeyCodes[inputActions.rightStick] = 210; // R3

            // Override to support both controller and keyboard
            actionKeyCodes[inputActions.moveLeft] = [keyCodes.leftArrow, 214, 205];
            actionKeyCodes[inputActions.moveRight] = [keyCodes.rightArrow, 213, 206];
            actionKeyCodes[inputActions.moveUp] = [keyCodes.upArrow, 211, 203];
            actionKeyCodes[inputActions.moveDown] = [keyCodes.downArrow, 212, 204];
            actionKeyCodes[inputActions.select] = [keyCodes.enter, keyCodes.space, 195]; // e.g. and buttonA
            actionKeyCodes[inputActions.back] = [keyCodes.esc, keyCodes.del, 196]; // e.g. and buttonB
        }

        function configureForFireTV() {
            configureForAndroidBase();
            self.isFireTV = true;
            self.name = "FireTV";

            // From: https://developer.amazon.com/docs/fire-tv/identify-amazon-fire-tv-devices.html
            const modelMatch = userAgent.match(/\bAFT[A-Z0-9]+\b/);
            const modelId = modelMatch && modelMatch[0];

            // Derived from https://developer.amazon.com/docs/fire-tv/identify-amazon-fire-tv-devices.html
            // NOTE: watch out for duplicates!
            const knownModels = {
                AFTA: "Fire TV Cube (Gen 1)",
                AFTB: "Fire TV (Gen 1)",
                AFTBAMR311: "Fire TV Edition - Toshiba HD (2018-2020)",
                AFTDCT31: "Fire TV Edition - 4K UHD (2020)",
                AFTEAMR311: "Fire TV Edition - Insignia HD (2018-2020)",
                AFTEU011: "Fire TV Edition - Grundig Vision 6 HD (2019)",
                AFTEU014: "Fire TV Edition - Grundig Vision 7 4K (2019)",
                AFTEUFF014: "Fire TV Edition - Grundig OLED 4K (2019)",
                AFTJMST12: "Fire TV Edition - Insignia 4K (2018)",
                AFTKMST12: "Fire TV Edition - Toshiba 4K (2018/2019)",
                AFTLE: "Fire TV Edition - Onida HD (2019)",
                AFTM: "Fire TV Stick (Gen 1)",
                AFTMM: "Fire TV Stick 4K",
                AFTN: "Fire TV (Gen 3)",
                AFTR: "Fire TV Cube (Gen 2)",
                AFTRS: "Fire TV Edition - Element 4K (2017)",
                AFTS: "Fire TV (Gen 2)",
                AFTSO001: "Fire TV Edition - JVC 4K (2019)",
                AFTT: "Fire TV Stick (Gen 2)"
            };
            self.model = knownModels[modelId] || "Fire TV";
            self.modelId = modelId;

            actionKeyCodes[inputActions.menu] = 18;

            const webPlatformMatch = userAgent.match(/AmazonWebAppPlatform\/([0-9]+)/);
            if (webPlatformMatch) {
                // Advertising id query is only supported for web apps using the cordova framework, or else
                // run with the Amazon Web App Tester.
                const platformVersion = parseInt(webPlatformMatch[1]) || 0;
                self.supportsUserAdvertisingId = platformVersion >= 3;
            }
        }

        function configureForAndroid() {
            self.model = null; // to be filled in below

            configureForAndroidBase();

            // Android in the user agent is true for both Android mobile and AndroidTV
            // Note also that we don't consider FireTV to be Android, to avoid confusing it with mobile devices.

            // The MIBOX is mobile hardware in a settop box! And so we need to hard code our knowledge that is
            // actually supposed to be an android TV DEVICE.
            const isMIBox = userAgent.match(/\bMIBOX/);

            if (self.supportsTouch && !isMIBox) {
                self.isAndroidMobile = true;
                self.name = "Android";

            } else {
                self.isAndroidTV = true;
                actionKeyCodes[inputActions.back] = 4;
                actionKeyCodes[inputActions.menu] = 82;
                self.name = "AndroidTV";
            }

            if (!self.model) self.model = self.name;
        }

        function configureForAndroidBase() {
            self.useWindowScroll = false;

            // Both AndroidTV and FireTV do not allow http: image GETs when
            // running under https:
            self.supportsHttpImagesWithHttps = false;

            // Both Android TV and Fire TV use history back actions instead of the explicit back key event.
            //
            // In contradiction to the Amazon FireTV Web FAQ, the back key event can actually be fielded by the app.
            // see: https://developer.amazon.com/docs/fire-tv/web-app-faq.html
            // see: https://forums.developer.amazon.com/questions/11752/particulars-of-html5-history-popstate-event-on-ama.html
            // Also verified experimentally ourselves.
            //
            // However, fielding that keystroke is still not reliable as the history back and popstate event processing
            // still occurs regardless.
            self.useHistoryBackActions = true;

            const androidApp = window.androidApp || window.fireTVApp;
            if (androidApp) {
                var detailString = androidApp.getAndroidDetails();
                var details = detailString.split(',');
                self.model = details[1];
                self.version = details[2];
            } else {
                var match = userAgent.match(/Android ([0-9](\.[0-9])*)/);
                if (match) {
                    self.version = match[1];
                }
            }

            addDefaultKeyMap();
            actionKeyCodes[inputActions.playPause] = 179;
            actionKeyCodes[inputActions.fastForward] = 228;
            actionKeyCodes[inputActions.rewind] = 227;
            actionKeyCodes[inputActions.extra] = 82;
        }

        function configureForUnknownPlatform() {
            self.isUnknown = true;
            self.supportsMouse = true;
            self.supportsTouch = true;
            addDefaultKeyMap();
            addTestingKeyCodes();
        }

        function addDefaultKeyMap() {
            actionKeyCodes[inputActions.moveLeft] = keyCodes.leftArrow;
            actionKeyCodes[inputActions.moveRight] = keyCodes.rightArrow;
            actionKeyCodes[inputActions.moveUp] = keyCodes.upArrow;
            actionKeyCodes[inputActions.moveDown] = keyCodes.downArrow;
            actionKeyCodes[inputActions.select] = [keyCodes.enter, keyCodes.space];
            actionKeyCodes[inputActions.back] = [keyCodes.esc, keyCodes.backspace, keyCodes.del];
            actionKeyCodes[inputActions.num0] = keyCodes.zero;
            actionKeyCodes[inputActions.num1] = keyCodes.one;
            actionKeyCodes[inputActions.num2] = keyCodes.two;
            actionKeyCodes[inputActions.num3] = keyCodes.three;
            actionKeyCodes[inputActions.num4] = keyCodes.four;
            actionKeyCodes[inputActions.num5] = keyCodes.five;
            actionKeyCodes[inputActions.num6] = keyCodes.six;
            actionKeyCodes[inputActions.num7] = keyCodes.seven;
            actionKeyCodes[inputActions.num8] = keyCodes.eight;
            actionKeyCodes[inputActions.num9] = keyCodes.nine;
        }

        // For testing with a physical keyboard.
        function addTestingKeyCodes() {
            actionKeyCodes[inputActions.playPause] = keyCodes.D;
            actionKeyCodes[inputActions.fastForward] = keyCodes.F;
            actionKeyCodes[inputActions.rewind] = keyCodes.S;
            actionKeyCodes[inputActions.nextTrack] = keyCodes.N;
            actionKeyCodes[inputActions.prevTrack] = keyCodes.R;

            // For testing left/right shoulder actions.
            actionKeyCodes[inputActions.leftShoulder1] = keyCodes.Q;
            actionKeyCodes[inputActions.leftShoulder2] = keyCodes.A;
            actionKeyCodes[inputActions.rightShoulder1] = keyCodes.P;
            actionKeyCodes[inputActions.rightShoulder2] = keyCodes.L;
            actionKeyCodes[inputActions.menu] = keyCodes.M;

            // For testing prev/next track actions
            actionKeyCodes[inputActions.prevTrack] = keyCodes.W;
            actionKeyCodes[inputActions.nextTrack] = keyCodes.O;
        }
    }

    /**
     * Returns a promise that resolves to the user's advertising id for the platform. Resolves to
     * undefined if the advertising id is either not available or else the user has opted out of
     * being tracked for advertising on their device.
     *
     * @return {Promise<String>}
     */
    async getUserAdvertisingId() {
        if (!this.supportsUserAdvertisingId) {
            return undefined;
        }

        if (this.isFireTV) {
            return this.getFireTVAdvertisingId();
        }

        return undefined; // fallback
    }

    async getFireTVAdvertisingId() {
        let AmazonAdvertising = window.AmazonAdvertising;
        if (!AmazonAdvertising) {
            const apiLoader = new ScriptLoader("https://resources.amazonwebapps.com/v1/latest/Amazon-Web-App-API.min.js");
            apiLoader.load();
            await apiLoader.promise;
            AmazonAdvertising = await new Promise(resolve => {
                document.addEventListener('amazonPlatformReady', onApiReady);

                function onApiReady() {
                    document.removeEventListener('amazonPlatformReady', onApiReady);
                    resolve(window.AmazonAdvertising);
                }
            });
            if (!AmazonAdvertising) {
                throw new Error("AmazonAdvertising API not available");
            }
        }
        const adIdPromise = new Promise((resolve, reject) => {
            AmazonAdvertising.getAdvertisingId(resolve, errMsg => {
                console.error(`getAdvertisingId: ${errMsg}`);
                resolve(undefined);
            })
        });
        const adTrackingPromise = new Promise((resolve, reject) => {
            AmazonAdvertising.getLimitAdTrackingPreference(resolve, errMsg => {
                console.error(`getLimitAdTrackingPreference: ${errMsg}`);
                resolve(false);
            })
        });
        return Promise.all([adIdPromise, adTrackingPromise])
        .then(results => {
            const adId = results[0];
            const limitTracking = results[1];
            return adId && !limitTracking ? adId : undefined;
        });
    }
}

