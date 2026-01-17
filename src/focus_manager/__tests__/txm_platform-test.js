import { describe, test } from 'node:test';
import assert from 'node:assert';
import { inputActions } from "../txm_input_actions.js";
import { TXMPlatform } from "../txm_platform.js";

describe("TXMPlatform", () => {

    describe("Unknown (desktop) platform tests", () => {
        let platform = new TXMPlatform();

        test("recognize the Unknown platform", () => {
            assert.strictEqual(platform.isUnknown, true);
            assert.strictEqual(platform.isFireTV, false);
            assert.strictEqual(platform.isAndroidTV, false);
            assert.strictEqual(platform.isVizio, false);
            assert.strictEqual(platform.isLG, false);
            assert.strictEqual(platform.isTizen, false);
            assert.strictEqual(platform.isPS4, false);
            assert.strictEqual(platform.isXboxOne, false);
            assert.strictEqual(platform.isComcast, false);
            assert.strictEqual(platform.isKepler, false);
            assert.strictEqual(platform.name, "Unknown");
            assert.strictEqual(platform.isCTV, false);
            assert.strictEqual(platform.isConsole, false);
        });

        test("unknown key mapping", () => {
            let keyCodes = platform.keyCodes;
            assert.strictEqual(platform.getInputAction(keyCodes.upArrow), inputActions.moveUp);
            assert.strictEqual(platform.getInputAction(keyCodes.downArrow), inputActions.moveDown);
            assert.strictEqual(platform.getInputAction(keyCodes.leftArrow), inputActions.moveLeft);
            assert.strictEqual(platform.getInputAction(keyCodes.rightArrow), inputActions.moveRight);
            assert.strictEqual(platform.getInputAction(keyCodes.enter), inputActions.select);
            assert.strictEqual(platform.getInputAction(keyCodes.backspace), inputActions.back);
            assert.strictEqual(platform.getInputAction(keyCodes.esc), inputActions.back);
            assert.strictEqual(platform.getInputAction(keyCodes.D), inputActions.playPause);
            assert.strictEqual(platform.getInputAction(keyCodes.Q), inputActions.leftShoulder1);
        });

        test("key mapping override", () => {
            let keyCodes = platform.keyCodes;
            platform.applyInputKeyMap({
                select: [keyCodes.D, keyCodes.space],
                back: keyCodes.B,
                moveUp: keyCodes.E,
                moveDown: keyCodes.X,
                moveLeft: keyCodes.S,
                moveRight: keyCodes.F
            });
            assert.strictEqual(platform.getInputAction(keyCodes.D), inputActions.select);
            assert.strictEqual(platform.getInputAction(keyCodes.space), inputActions.select);
            assert.strictEqual(platform.getInputAction(keyCodes.B), inputActions.back);
            assert.strictEqual(platform.getInputAction(keyCodes.E), inputActions.moveUp);
            assert.strictEqual(platform.getInputAction(keyCodes.X), inputActions.moveDown);
            assert.strictEqual(platform.getInputAction(keyCodes.S), inputActions.moveLeft);
            assert.strictEqual(platform.getInputAction(keyCodes.F), inputActions.moveRight);

            // note that existing mappings are not removed
            assert.strictEqual(platform.getInputAction(keyCodes.enter), inputActions.select);
            assert.strictEqual(platform.getInputAction(keyCodes.esc), inputActions.back);
            assert.strictEqual(platform.getInputAction(keyCodes.upArrow), inputActions.moveUp);
        });

        test("default ad id support", async () => {
            assert.strictEqual(platform.supportsUserAdvertisingId, false);
            const adId = await platform.getUserAdvertisingId();
            assert.strictEqual(adId, undefined);
        });
    });

    describe("FireTV Tests", () => {
        let platform = new TXMPlatform("Mozilla/5.0 (Linux; Android 5.1.1) AFTT Build/LVY48F; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/70.0.3538.110 Mobile Safari/537.36 cordova-amazon-fireos/3.4.0 AmazonWebAppPlatform/3.4.0;2.0");

        test("recognize the FireTV platform", () => {
            assert.strictEqual(platform.isUnknown, false);
            assert.strictEqual(platform.isFireTV, true);
            assert.strictEqual(platform.isAndroidTV, false);
            assert.strictEqual(platform.isAndroidMobile, false);
            // we don't consider FireTV to be Android, to avoid confusing it with mobile devices
            assert.strictEqual(platform.isAndroid, false);
            assert.strictEqual(platform.isVizio, false);
            assert.strictEqual(platform.isLG, false);
            assert.strictEqual(platform.isTizen, false);
            assert.strictEqual(platform.isPS4, false);
            assert.strictEqual(platform.isXboxOne, false);
            assert.strictEqual(platform.isComcast, false);
            assert.strictEqual(platform.isKepler, false);
            assert.strictEqual(platform.name, "FireTV");
            assert.strictEqual(platform.model, "Fire TV Stick (Gen 2)");
            assert.strictEqual(platform.modelId, "AFTT");
            assert.strictEqual(platform.version, "5.1.1");
            assert.strictEqual(platform.isCTV, true);
            assert.strictEqual(platform.isConsole, false);
            assert.strictEqual(platform.isHandheld, false);
            assert.strictEqual(platform.isTablet, false);
        });

        test("FireTV key mapping", () => {
            let keyCodes = platform.keyCodes;
            assert.strictEqual(platform.getInputAction(18), inputActions.menu);
            assert.strictEqual(platform.getInputAction(keyCodes.downArrow), inputActions.moveDown);
            assert.strictEqual(platform.getInputAction(keyCodes.leftArrow), inputActions.moveLeft);
            assert.strictEqual(platform.getInputAction(keyCodes.rightArrow), inputActions.moveRight);
            assert.strictEqual(platform.getInputAction(keyCodes.enter), inputActions.select);
            assert.strictEqual(platform.getInputAction(keyCodes.esc), inputActions.back);
        });

        test("ad id is supported", () => {
            // We can't actually query the ad id from tests, but we can ensure that it is assumed to be supported.
            assert.strictEqual(platform.supportsUserAdvertisingId, true);
        });

        test("test firetv edition model", () => {
            const platform = new TXMPlatform("Mozilla/5.0 (Linux; Android 7.1.2; AFTJMST12 Build/NS6271; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/70.0.3538.110 Mobile Safari/537.36 cordova-amazon-fireos/3.4.0 AmazonWebAppPlatform/3.4.0;2.0");
            assert.strictEqual(platform.isFireTV, true);
            assert.strictEqual(platform.name, "FireTV");
            assert.strictEqual(platform.model, "Fire TV Edition - Insignia 4K (2018)");
            assert.strictEqual(platform.modelId, "AFTJMST12");
            assert.strictEqual(platform.version, "7.1.2");
        });
    });

    describe("Android TV Tests", () => {
        // Shield TV:
        const platform = new TXMPlatform("Mozilla/5.0 (Linux; U; Android 5.1; SHIELD Android TV Build/LMY47D) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 UCBrowser/10.5.2.582 U3/0.8.0 Mobile Safari/534.30");

        test("recognize the AndroidTV platform", () => {
            assert.strictEqual(platform.isUnknown, false);
            assert.strictEqual(platform.isFireTV, false);
            assert.strictEqual(platform.isAndroidTV, true);
            assert.strictEqual(platform.isAndroid, true);
            assert.strictEqual(platform.isAndroidMobile, false);
            assert.strictEqual(platform.isVizio, false);
            assert.strictEqual(platform.isLG, false);
            assert.strictEqual(platform.isTizen, false);
            assert.strictEqual(platform.isPS4, false);
            assert.strictEqual(platform.isXboxOne, false);
            assert.strictEqual(platform.isComcast, false);
            assert.strictEqual(platform.isKepler, false);
            assert.strictEqual(platform.name, "AndroidTV");
            assert.strictEqual(platform.model, platform.name);
            assert.strictEqual(platform.version, "5.1");
            assert.strictEqual(platform.isCTV, true);
            assert.strictEqual(platform.isConsole, false);
            assert.strictEqual(platform.isHandheld, false);
            assert.strictEqual(platform.isTablet, false);
        });

        test("AndroidTV key mapping", () => {
            const keyCodes = platform.keyCodes;
            assert.strictEqual(platform.getInputAction(82), inputActions.menu);
            assert.strictEqual(platform.getInputAction(keyCodes.downArrow), inputActions.moveDown);
            assert.strictEqual(platform.getInputAction(keyCodes.leftArrow), inputActions.moveLeft);
            assert.strictEqual(platform.getInputAction(keyCodes.rightArrow), inputActions.moveRight);
            assert.strictEqual(platform.getInputAction(keyCodes.enter), inputActions.select);
            assert.strictEqual(platform.getInputAction(4), inputActions.back);
        });

        test("test MIBOX is an AndroidTV", () => {
            // The MIBOX is mobile hardware! It supports touch, has "Mobile" in its user agent, and yet it is actually
            // a set top box. Cheap hardware for the win!
            const platform = new TXMPlatform("Mozilla/5.0 (Linux; Android 9; MIBOX4 Build/PI; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/99.0.4844.73 Mobile Safari/537.36");
            assert.strictEqual(platform.isAndroidTV, true);
            assert.strictEqual(platform.isAndroid, true);
            assert.strictEqual(platform.isAndroidMobile, false);
        });

    });

    describe("Android Phone Tests", () => {
        navigator.maxTouchPoints = 1; // touch support is the key to determine mobile vs TV

        // Nokia example:
        let platform = new TXMPlatform("Mozilla/5.0 (Linux; U; Android 4.2; ru-ru; Nokia_X Build/JDQ39) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.2 Mobile Safari/E7FBAF");

        test("recognize the Android mobile platform", () => {
            assert.strictEqual(platform.isUnknown, false);
            assert.strictEqual(platform.isFireTV, false);
            assert.strictEqual(platform.isAndroidTV, false);
            assert.strictEqual(platform.isAndroid, true);
            assert.strictEqual(platform.isAndroidMobile, true);
            assert.strictEqual(platform.isVizio, false);
            assert.strictEqual(platform.isLG, false);
            assert.strictEqual(platform.isTizen, false);
            assert.strictEqual(platform.isPS4, false);
            assert.strictEqual(platform.isXboxOne, false);
            assert.strictEqual(platform.isComcast, false);
            assert.strictEqual(platform.isKepler, false);
            assert.strictEqual(platform.name, "Android");
            assert.strictEqual(platform.model, platform.name);
            assert.strictEqual(platform.version, "4.2");
            assert.strictEqual(platform.isCTV, false);
            assert.strictEqual(platform.isConsole, false);
            assert.strictEqual(platform.isHandheld, true);
            assert.strictEqual(platform.isTablet, false);
        });
    });


    describe("Android Tablet Tests", () => {
        navigator.maxTouchPoints = 1; // touch support is the key to determine mobile vs TV

        // Samsung Galaxy Tablet:
        let platform = new TXMPlatform("Mozilla/5.0 (Linux; Android 7.1.1; SM-T555 Build/NMF26X; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/83.0.4103.96 Safari/537.36");

        test("recognize the Android mobile platform", () => {
            assert.strictEqual(platform.isUnknown, false);
            assert.strictEqual(platform.isFireTV, false);
            assert.strictEqual(platform.isAndroidTV, false);
            assert.strictEqual(platform.isAndroid, true);
            assert.strictEqual(platform.isAndroidMobile, true);
            assert.strictEqual(platform.isVizio, false);
            assert.strictEqual(platform.isLG, false);
            assert.strictEqual(platform.isTizen, false);
            assert.strictEqual(platform.isPS4, false);
            assert.strictEqual(platform.isXboxOne, false);
            assert.strictEqual(platform.isComcast, false);
            assert.strictEqual(platform.isKepler, false);
            assert.strictEqual(platform.name, "Android");
            assert.strictEqual(platform.model, platform.name);
            assert.strictEqual(platform.version, "7.1.1");
            assert.strictEqual(platform.isCTV, false);
            assert.strictEqual(platform.isConsole, false);
            assert.strictEqual(platform.isHandheld, false);
            assert.strictEqual(platform.isTablet, true);
        });
    });

    describe("Vizio Tests", () => {
        let platform = new TXMPlatform(
            "Mozilla/5.0 (X11; Linux armv7l) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Safari/537.36 CrKey/1.0.999999 VIZIO SmartCast(Conjure/SX7A-2.0.9.0 FW/9.0.5.2 Model/E50x-E1)"
        );

        test("recognize the Vizio platform", () => {
            assert.strictEqual(platform.isUnknown, false);
            assert.strictEqual(platform.isFireTV, false);
            assert.strictEqual(platform.isAndroidTV, false);
            assert.strictEqual(platform.isVizio, true);
            assert.strictEqual(platform.isLG, false);
            assert.strictEqual(platform.isTizen, false);
            assert.strictEqual(platform.isPS4, false);
            assert.strictEqual(platform.isXboxOne, false);
            assert.strictEqual(platform.isComcast, false);
            assert.strictEqual(platform.isKepler, false);
            assert.strictEqual(platform.name, "Vizio");
            assert.strictEqual(platform.isCTV, true);
            assert.strictEqual(platform.isConsole, false);
            assert.strictEqual(platform.model, "E50x-E1");
            assert.strictEqual(platform.version, "9.0.5.2");
        });

        test("vizio key mapping", () => {
            let keyCodes = platform.keyCodes;
            assert.strictEqual(platform.getInputAction(keyCodes.upArrow), inputActions.moveUp);
            assert.strictEqual(platform.getInputAction(keyCodes.downArrow), inputActions.moveDown);
            assert.strictEqual(platform.getInputAction(keyCodes.leftArrow), inputActions.moveLeft);
            assert.strictEqual(platform.getInputAction(keyCodes.rightArrow), inputActions.moveRight);
            assert.strictEqual(platform.getInputAction(keyCodes.enter), inputActions.select);
            assert.strictEqual(platform.getInputAction(keyCodes.backspace), inputActions.back);
            assert.strictEqual(platform.getInputAction(keyCodes.esc), inputActions.exit);
            assert.strictEqual(platform.getInputAction(415), inputActions.playPause);
            assert.strictEqual(platform.getInputAction(19), inputActions.playPause);
        });
    });

    describe("Comcast Tests", () => {

        window.$badger = {
            deviceInfo(callback) {
                callback({modelNameAscii: "Comcast Fake Model", version: "1.2.3"});
            }
        };


        let platform = new TXMPlatform(
          "Mozilla/5.0 (Linux; x86_64 GNU/Linux) AppleWebKit/601.1 (KHTML, like Gecko) Version/8.0 Safari/601.1 WPE"
        );

        delete window.$badger;

        test("recognize the Comcast platform", () => {
            assert.strictEqual(platform.isUnknown, false);
            assert.strictEqual(platform.isFireTV, false);
            assert.strictEqual(platform.isAndroidTV, false);
            assert.strictEqual(platform.isVizio, false);
            assert.strictEqual(platform.isLG, false);
            assert.strictEqual(platform.isTizen, false);
            assert.strictEqual(platform.isPS4, false);
            assert.strictEqual(platform.isXboxOne, false);
            assert.strictEqual(platform.isComcast, true);
            assert.strictEqual(platform.isKepler, false);
            assert.strictEqual(platform.name, "Comcast");
            assert.strictEqual(platform.isCTV, true);
            assert.strictEqual(platform.isConsole, false);
            assert.strictEqual(platform.model, "Comcast");
        });

        test("comcast key mapping", () => {
            let keyCodes = platform.keyCodes;
            assert.strictEqual(platform.getInputAction(keyCodes.upArrow), inputActions.moveUp);
            assert.strictEqual(platform.getInputAction(keyCodes.downArrow), inputActions.moveDown);
            assert.strictEqual(platform.getInputAction(keyCodes.leftArrow), inputActions.moveLeft);
            assert.strictEqual(platform.getInputAction(keyCodes.rightArrow), inputActions.moveRight);
            assert.strictEqual(platform.getInputAction(keyCodes.enter), inputActions.select);
            assert.strictEqual(platform.getInputAction(keyCodes.backspace), inputActions.back);
            assert.strictEqual(platform.getInputAction(179), inputActions.playPause);
            assert.strictEqual(platform.getInputAction(227), inputActions.rewind);
            assert.strictEqual(platform.getInputAction(228), inputActions.fastForward);
        });
    });

    describe("Kepler Tests", () => {

        let platform = new TXMPlatform(
            "Mozilla/5.0 (Linux; Kepler 1.1; AFTCA002 user-external/4418; wv) AppleWebKit/537.36 (KHTML, like Gecko) Mobile Chrome/132.0.6834.209 Safari/537.36"
        );

        test("recognize the Kepler platform", () => {
            assert.strictEqual(platform.isUnknown, false);
            assert.strictEqual(platform.isFireTV, false);
            assert.strictEqual(platform.isAndroidTV, false);
            assert.strictEqual(platform.isVizio, false);
            assert.strictEqual(platform.isLG, false);
            assert.strictEqual(platform.isTizen, false);
            assert.strictEqual(platform.isPS4, false);
            assert.strictEqual(platform.isXboxOne, false);
            assert.strictEqual(platform.isComcast, false);
            assert.strictEqual(platform.isKepler, true);
            assert.strictEqual(platform.name, "Kepler");
            assert.strictEqual(platform.version, "1.1");
            assert.strictEqual(platform.isCTV, true);
            assert.strictEqual(platform.isConsole, false);
            assert.strictEqual(platform.model, "AFTCA002");
        });

        test("Kepler key mapping", () => {
            const keyCodes = platform.keyCodes;
            assert.strictEqual(platform.getInputAction(keyCodes.upArrow), inputActions.moveUp);
            assert.strictEqual(platform.getInputAction(keyCodes.downArrow), inputActions.moveDown);
            assert.strictEqual(platform.getInputAction(keyCodes.leftArrow), inputActions.moveLeft);
            assert.strictEqual(platform.getInputAction(keyCodes.rightArrow), inputActions.moveRight);
            assert.strictEqual(platform.getInputAction(keyCodes.enter), inputActions.select);
            assert.strictEqual(platform.getInputAction(keyCodes.backspace), inputActions.back);
            assert.strictEqual(platform.getInputAction(keyCodes.esc), inputActions.back);
            assert.strictEqual(platform.getInputAction(179), inputActions.playPause);
            assert.strictEqual(platform.getInputAction(227), inputActions.rewind);
            assert.strictEqual(platform.getInputAction(228), inputActions.fastForward);
        });
    });

    describe("LG Tests", () => {
        // Mock LG OS API
        window.PalmSystem = new Object();
        window.webOS = {
            deviceInfo(callback) {
                callback({modelNameAscii: "LG Fake Model", version: "1.2.3"});
            }
        };

        let platform = new TXMPlatform();

        // Should no longer be needed. Clean up to prevent affecting future tests.
        delete window.PalmSystem;
        delete window.webOS;

        test("recognize the LG platform", () => {
            assert.strictEqual(platform.isUnknown, false);
            assert.strictEqual(platform.isFireTV, false);
            assert.strictEqual(platform.isAndroidTV, false);
            assert.strictEqual(platform.isVizio, false);
            assert.strictEqual(platform.isLG, true);
            assert.strictEqual(platform.isTizen, false);
            assert.strictEqual(platform.isPS4, false);
            assert.strictEqual(platform.isXboxOne, false);
            assert.strictEqual(platform.isComcast, false);
            assert.strictEqual(platform.isKepler, false);
            assert.strictEqual(platform.name, "LG");
            assert.strictEqual(platform.model, "LG Fake Model");
            assert.strictEqual(platform.version, "1.2.3");
            assert.strictEqual(platform.isCTV, true);
            assert.strictEqual(platform.isConsole, false);
        });

        test("LG key mapping", () => {
            let keyCodes = platform.keyCodes;
            assert.strictEqual(platform.getInputAction(keyCodes.upArrow), inputActions.moveUp);
            assert.strictEqual(platform.getInputAction(keyCodes.downArrow), inputActions.moveDown);
            assert.strictEqual(platform.getInputAction(keyCodes.leftArrow), inputActions.moveLeft);
            assert.strictEqual(platform.getInputAction(keyCodes.rightArrow), inputActions.moveRight);
            assert.strictEqual(platform.getInputAction(keyCodes.enter), inputActions.select);
            assert.strictEqual(platform.getInputAction(461), inputActions.back);
            assert.ok(!platform.getInputAction(keyCodes.esc));
            assert.strictEqual(platform.getInputAction(415), inputActions.playPause);
            assert.strictEqual(platform.getInputAction(19), inputActions.playPause);
            assert.strictEqual(platform.getInputAction(403), inputActions.red);
            assert.strictEqual(platform.getInputAction(404), inputActions.green);
        });
    });

    describe("Tizen Tests", () => {
        let platform = new TXMPlatform(
            "Mozilla/5.0 (SMART-TV; LINUX; Tizen 4.0) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 TV Safari/537.36"
        );

        test("recognize the Tizen platform", () => {
            assert.strictEqual(platform.isUnknown, false);
            assert.strictEqual(platform.isFireTV, false);
            assert.strictEqual(platform.isAndroidTV, false);
            assert.strictEqual(platform.isVizio, false);
            assert.strictEqual(platform.isLG, false);
            assert.strictEqual(platform.isTizen, true);
            assert.strictEqual(platform.isPS4, false);
            assert.strictEqual(platform.isXboxOne, false);
            assert.strictEqual(platform.isComcast, false);
            assert.strictEqual(platform.isKepler, false);
            assert.strictEqual(platform.name, "Tizen");
            assert.strictEqual(platform.model, "2018");
            assert.strictEqual(platform.version, "4.0");
            assert.strictEqual(platform.isCTV, true);
            assert.strictEqual(platform.isConsole, false);
        });

        test("Tizen key mapping", () => {
            let keyCodes = platform.keyCodes;
            assert.strictEqual(platform.getInputAction(keyCodes.upArrow), inputActions.moveUp);
            assert.strictEqual(platform.getInputAction(keyCodes.downArrow), inputActions.moveDown);
            assert.strictEqual(platform.getInputAction(keyCodes.leftArrow), inputActions.moveLeft);
            assert.strictEqual(platform.getInputAction(keyCodes.rightArrow), inputActions.moveRight);
            assert.strictEqual(platform.getInputAction(keyCodes.enter), inputActions.select);
            assert.strictEqual(platform.getInputAction(10009), inputActions.back);
            assert.strictEqual(platform.getInputAction(415), inputActions.playPause);
            assert.strictEqual(platform.getInputAction(19), inputActions.playPause);
            assert.strictEqual(platform.getInputAction(403), inputActions.red);
            assert.strictEqual(platform.getInputAction(404), inputActions.green);
        });
    });

    describe("PS4 Tests", () => {
        test("recognize the PS4 platform, old version", () => {
            let platform = new TXMPlatform(
                "Mozilla/5.0 (PlayStation 4 5.05) AppleWebKit/601.2 (KHTML, like Gecko)"
            );
            assert.strictEqual(platform.isUnknown, false);
            assert.strictEqual(platform.isFireTV, false);
            assert.strictEqual(platform.isAndroidTV, false);
            assert.strictEqual(platform.isVizio, false);
            assert.strictEqual(platform.isLG, false);
            assert.strictEqual(platform.isTizen, false);
            assert.strictEqual(platform.isPS4, true);
            assert.strictEqual(platform.isXboxOne, false);
            assert.strictEqual(platform.isComcast, false);
            assert.strictEqual(platform.isKepler, false);
            assert.strictEqual(platform.name, "PS4");
            assert.strictEqual(platform.model, "PS4");
            assert.strictEqual(platform.version, "5.05");
            assert.strictEqual(platform.isCTV, false);
            assert.strictEqual(platform.isConsole, true);
        });

        let platform = new TXMPlatform(
            "Mozilla/5.0 (PlayStation 4 WebMAF) AppleWebKit/601.2 (KHTML, like Gecko) WebMAF/v1.2.30.4-gd34FFEE something extra"
        );

        test("recognize the PS4 platform, new version", () => {
            assert.strictEqual(platform.isUnknown, false);
            assert.strictEqual(platform.isFireTV, false);
            assert.strictEqual(platform.isAndroidTV, false);
            assert.strictEqual(platform.isVizio, false);
            assert.strictEqual(platform.isLG, false);
            assert.strictEqual(platform.isTizen, false);
            assert.strictEqual(platform.isPS4, true);
            assert.strictEqual(platform.isXboxOne, false);
            assert.strictEqual(platform.isComcast, false);
            assert.strictEqual(platform.isKepler, false);
            assert.strictEqual(platform.name, "PS4");
            assert.strictEqual(platform.model, "PS4");
            assert.strictEqual(platform.version, "WebMAF/v1.2.30.4");
            assert.strictEqual(platform.isCTV, false);
            assert.strictEqual(platform.isConsole, true);
        });

        test("PS4 key mapping", () => {
            let keyCodes = platform.keyCodes;
            assert.strictEqual(platform.getInputAction(keyCodes.upArrow), inputActions.moveUp);
            assert.strictEqual(platform.getInputAction(keyCodes.downArrow), inputActions.moveDown);
            assert.strictEqual(platform.getInputAction(keyCodes.leftArrow), inputActions.moveLeft);
            assert.strictEqual(platform.getInputAction(keyCodes.rightArrow), inputActions.moveRight);
            assert.strictEqual(platform.getInputAction(keyCodes.enter), inputActions.select);
            assert.strictEqual(platform.getInputAction(keyCodes.esc), inputActions.back);
            assert.strictEqual(platform.getInputAction(128), inputActions.playPause);
            assert.strictEqual(platform.getInputAction(130), inputActions.playPause);
            assert.strictEqual(platform.getInputAction(keyCodes.space), inputActions.buttonSquare);
            assert.strictEqual(platform.getInputAction(112), inputActions.buttonTriangle);
        });
    });

    describe("PS5 Tests", () => {
        let platform = new TXMPlatform(
            "Mozilla/5.0 (PlayStation; PlayStation 5/1.05) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0 Safari/6.05.1.15"
        );

        test("recognize the PS5 platform", () => {
            assert.strictEqual(platform.isUnknown, false);
            assert.strictEqual(platform.isFireTV, false);
            assert.strictEqual(platform.isAndroidTV, false);
            assert.strictEqual(platform.isVizio, false);
            assert.strictEqual(platform.isLG, false);
            assert.strictEqual(platform.isTizen, false);
            assert.strictEqual(platform.isPS4, false);
            assert.strictEqual(platform.isPS5, true);
            assert.strictEqual(platform.isXboxOne, false);
            assert.strictEqual(platform.isComcast, false);
            assert.strictEqual(platform.isKepler, false);
            assert.strictEqual(platform.name, "PS5");
            assert.strictEqual(platform.model, "PS5");
            assert.strictEqual(platform.version, "1.05");
            assert.strictEqual(platform.isCTV, false);
            assert.strictEqual(platform.isConsole, true);
        });

        test("PS5 key mapping", () => {
            let keyCodes = platform.keyCodes;
            assert.strictEqual(platform.getInputAction(keyCodes.upArrow), inputActions.moveUp);
            assert.strictEqual(platform.getInputAction(keyCodes.downArrow), inputActions.moveDown);
            assert.strictEqual(platform.getInputAction(keyCodes.leftArrow), inputActions.moveLeft);
            assert.strictEqual(platform.getInputAction(keyCodes.rightArrow), inputActions.moveRight);
            assert.strictEqual(platform.getInputAction(keyCodes.enter), inputActions.select);
            assert.strictEqual(platform.getInputAction(keyCodes.esc), inputActions.back);
            assert.strictEqual(platform.getInputAction(128), inputActions.playPause);
            assert.strictEqual(platform.getInputAction(130), inputActions.playPause);
            assert.strictEqual(platform.getInputAction(keyCodes.space), inputActions.buttonSquare);
            assert.strictEqual(platform.getInputAction(112), inputActions.buttonTriangle);
        });
    });

    describe("XboxOne Tests", () => {
        const xboxUserAgent = "need just 'Xbox' in the user agent";

        test("recognize the XboxOne platform without Windows.* API", () => {
            let platform = new TXMPlatform(xboxUserAgent);

            assert.strictEqual(platform.isUnknown, false);
            assert.strictEqual(platform.isFireTV, false);
            assert.strictEqual(platform.isAndroidTV, false);
            assert.strictEqual(platform.isVizio, false);
            assert.strictEqual(platform.isLG, false);
            assert.strictEqual(platform.isTizen, false);
            assert.strictEqual(platform.isPS4, false);
            assert.strictEqual(platform.isXboxOne, true);
            assert.strictEqual(platform.isComcast, false);
            assert.strictEqual(platform.isKepler, false);
            assert.strictEqual(platform.name, "XboxOne");
            assert.strictEqual(platform.model, "Windows.Xbox");
            assert.strictEqual(platform.version, "Unknown");
            assert.strictEqual(platform.isCTV, false);
            assert.strictEqual(platform.isConsole, true);
        });

        test("recognize the XboxOne platform with the Windows.* API", () => {
            // Mock Window API objects
            window.Windows = {
                System: {
                    Profile: {
                        AnalyticsInfo: {
                            versionInfo: {
                                deviceFamily: "Windows.Xbox",
                                deviceFamilyVersion: "1.2.3"
                            }
                        }
                    }
                }
            };

            let platform = new TXMPlatform(xboxUserAgent);

            // Should no longer be needed.
            delete window.Windows;

            assert.strictEqual(platform.isUnknown, false);
            assert.strictEqual(platform.isFireTV, false);
            assert.strictEqual(platform.isAndroidTV, false);
            assert.strictEqual(platform.isVizio, false);
            assert.strictEqual(platform.isLG, false);
            assert.strictEqual(platform.isTizen, false);
            assert.strictEqual(platform.isPS4, false);
            assert.strictEqual(platform.isXboxOne, true);
            assert.strictEqual(platform.isComcast, false);
            assert.strictEqual(platform.isKepler, false);
            assert.strictEqual(platform.name, "XboxOne");
            assert.strictEqual(platform.model, "Windows.Xbox");
            assert.strictEqual(platform.version, "1.2.3");
            assert.strictEqual(platform.isCTV, false);
            assert.strictEqual(platform.isConsole, true);
        });

        test("XboxOne key mapping", () => {
            let platform = new TXMPlatform(xboxUserAgent);
            let keyCodes = platform.keyCodes;
            assert.strictEqual(platform.getInputAction(keyCodes.upArrow), inputActions.moveUp);
            assert.strictEqual(platform.getInputAction(211), inputActions.moveUp);
            assert.strictEqual(platform.getInputAction(203), inputActions.moveUp);
            assert.strictEqual(platform.getInputAction(keyCodes.downArrow), inputActions.moveDown);
            assert.strictEqual(platform.getInputAction(keyCodes.leftArrow), inputActions.moveLeft);
            assert.strictEqual(platform.getInputAction(keyCodes.rightArrow), inputActions.moveRight);
            assert.strictEqual(platform.getInputAction(keyCodes.enter), inputActions.select);
            assert.strictEqual(platform.getInputAction(keyCodes.esc), inputActions.back);
            assert.strictEqual(platform.getInputAction(197), inputActions.buttonX);
            assert.strictEqual(platform.getInputAction(198), inputActions.buttonY);
            assert.strictEqual(platform.getInputAction(200), inputActions.leftShoulder1);
            assert.strictEqual(platform.getInputAction(199), inputActions.rightShoulder1);
        });
    });
});
