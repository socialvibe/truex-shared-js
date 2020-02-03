import { inputActions } from './txm_input_actions';
import { ScriptLoader } from '../utils/loaders';

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
    S: 83,
    D: 68,
    F: 70,
    L: 76,
    M: 77,
    O: 79,
    P: 80,
    Q: 81,
    W: 87,
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
        this.isPS4 = false;

        this.isFireTV = false;
        this.isAndroidTV = false;

        this.isXboxOne = false;
        this.isNintendoSwitch = false;

        // Scroll support:

        // If true (e.g. for LG WebOS), scrolling only works via scrollTop changes on a top level div.
        this.useScrollTop = false;

        // Otherwise we rely on window.scrollTo, but that only works if we are not scaled.
        this.useWindowScroll = true;

        this.supportsGyro = false; // on all platforms except perhaps for the Switch?


        // Most platforms allow http: image GETs when running under https:, even the latest Chrome.
        // AndroidTV/FireTV does not however.
        this.supportsHttpImagesWithHttps = true;

        this._inputKeyMap = {};

        let userAgent = userAgentOverride || window.navigator.userAgent;
        this.userAgent = userAgent;

        this._configure(userAgent);
    }

    get isAndroidOrFireTV() { return this.isAndroidTV || this.isFireTV }

    get isHandheld() { return this.isIPhone || this.isAndroid && /Mobile/.test(this.userAgent) }
    get isTablet() { return this.isIPad || this.isAndroid && !this.isHandheld }

    get isCTV() { return this.isLG || this.isVizio || this.isTizen || this.isAndroidTV || this.isFireTV }
    get isConsole() { return this.isXboxOne || this.isPS4 || this.isNintendoSwitch }


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
        return this._inputKeyMap[keyCode];
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

        // } else if (/Nintendo/.test(userAgent)) {
        //     configureForNintendoSwitch();

        } else if (window.Windows && Windows.System && Windows.System.Profile
                    && Windows.System.Profile.AnalyticsInfo && Windows.System.Profile.AnalyticsInfo.versionInfo
                    && Windows.System.Profile.AnalyticsInfo.versionInfo.deviceFamily == "Windows.Xbox") {
            configureForXboxOne();

        } else if (/Android/.test(userAgent)) {
            // TODO: distinguish between Android mobile and Android TV
            if (/AFT/.test(userAgent)) {
                configureForFireTV();
            } else {
                configureForAndroidTV();
            }

        } else {
            configureForUnknownPlatform();
        }

        // Establish the direct key code to input action mapping.
        self._inputKeyMap = {};
        for(let action in actionKeyCodes) {
            let actionCodes = actionKeyCodes[action];
            if (Array.isArray(actionCodes)) {
                actionCodes.forEach(keyCode => {
                    self._inputKeyMap[keyCode] = action;
                });
            } else {
                // Assume a single key code.
                self._inputKeyMap[actionCodes] = action;
            }
        }

        function configureForLgWebOs() {
            self.isLG = true;
            self.name = "LG";

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

            // We need to query the smartcast details once its library has loaded.
            var companionLibLoader = new ScriptLoader("http://localhost:12345/scfs/cl/js/vizio-companion-lib");
            companionLibLoader.promise.then(() => {
                var VIZIO = window.VIZIO;
                if (!VIZIO) {
                    console.error("TXPlatform: did not load Vizio companion lib");
                    return;
                }
                self.model = VIZIO.deviceModel;
                VIZIO.getFirmwareVersion(firmwareVersion => {
                    self.version = firmwareVersion;
                });
            });
            companionLibLoader.load();

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

        function configureForPS4() {
            self.isPS4 = true;
            self.name = "PS4";
            self.model = self.name;
            let versionMatch = userAgent.match(/PlayStation 4 ([^\s)]+)\)/);
            if (versionMatch) self.version = versionMatch[1];

            self.useWindowScroll = false;

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

            var analyticsInfo = Windows.System.Profile.AnalyticsInfo;
            var versionInfo = analyticsInfo.versionInfo;
            self.model = versionInfo.deviceFamily;
            self.version = versionInfo.deviceFamilyVersion;

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
            self.isFireTV = true;
            self.name = "FireTV";
            self.useWindowScroll = false;
            // Both AndroidTV and FireTV do not allow http: image GETs when running under https:
            self.supportsHttpImagesWithHttps = false;
            addAndroidTVKeyCodes();
        }

        function configureForAndroidTV() {
            self.isAndroidTV = true;
            self.name = "AndroidTV";
            self.useWindowScroll = false;
            // Both AndroidTV and FireTV do not allow http: image GETs when running under https:
            self.supportsHttpImagesWithHttps = false;
            addAndroidTVKeyCodes();
        }

        function configureForUnknownPlatform() {
            self.isUnknown = true;
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

        function addAndroidTVKeyCodes() {
            addDefaultKeyMap();

            actionKeyCodes[inputActions.playPause] = 179;
            actionKeyCodes[inputActions.fastForward] = 228;
            actionKeyCodes[inputActions.rewind] = 227;
            actionKeyCodes[inputActions.extra] = 82;
        }
    }

}

