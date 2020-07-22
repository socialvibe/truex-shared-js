import { inputActions} from "../txm_input_actions";
import { TXMPlatform } from "../txm_platform";

describe("TXMPlatform", () => {

    describe("Unknown (desktop) platform tests", () => {
        let platform = new TXMPlatform();

        test("recognize the Unknown platform", () => {
            expect(platform.isUnknown).toBe(true);
            expect(platform.isFireTV).toBe(false);
            expect(platform.isAndroidTV).toBe(false);
            expect(platform.isVizio).toBe(false);
            expect(platform.isLG).toBe(false);
            expect(platform.isTizen).toBe(false);
            expect(platform.isPS4).toBe(false);
            expect(platform.isXboxOne).toBe(false);
            expect(platform.name).toBe("Unknown");
            expect(platform.isCTV).toBe(false);
            expect(platform.isConsole).toBe(false);
        });

        test("unknown key mapping", () => {
            let keyCodes = platform.keyCodes;
            expect(platform.getInputAction(keyCodes.upArrow)).toBe(inputActions.moveUp);
            expect(platform.getInputAction(keyCodes.downArrow)).toBe(inputActions.moveDown);
            expect(platform.getInputAction(keyCodes.leftArrow)).toBe(inputActions.moveLeft);
            expect(platform.getInputAction(keyCodes.rightArrow)).toBe(inputActions.moveRight);
            expect(platform.getInputAction(keyCodes.enter)).toBe(inputActions.select);
            expect(platform.getInputAction(keyCodes.backspace)).toBe(inputActions.back);
            expect(platform.getInputAction(keyCodes.esc)).toBe(inputActions.back);
            expect(platform.getInputAction(keyCodes.D)).toBe(inputActions.playPause);
            expect(platform.getInputAction(keyCodes.Q)).toBe(inputActions.leftShoulder1);
        });

        test("default ad id support", () => {
            expect(platform.supportsUserAdvertisingId).toBe(false);
            return platform.getUserAdvertisingId().then(adId => {
                expect(adId).toBe(undefined);
            });
        })
    });

    describe("FireTV Tests", () => {
        let platform = new TXMPlatform("Mozilla/5.0 (Linux; Android 5.1.1) AFTT Build/LVY48F; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/70.0.3538.110 Mobile Safari/537.36 cordova-amazon-fireos/3.4.0 AmazonWebAppPlatform/3.4.0;2.0");

        test("recognize the FireTV platform", () => {
            expect(platform.isUnknown).toBe(false);
            expect(platform.isFireTV).toBe(true);
            expect(platform.isAndroidTV).toBe(false);
            expect(platform.isVizio).toBe(false);
            expect(platform.isLG).toBe(false);
            expect(platform.isTizen).toBe(false);
            expect(platform.isPS4).toBe(false);
            expect(platform.isXboxOne).toBe(false);
            expect(platform.name).toBe("FireTV");
            expect(platform.model).toBe("Fire TV Stick (Gen 2)");
            expect(platform.modelId).toBe("AFTT");
            expect(platform.version).toBe("5.1.1");
            expect(platform.isCTV).toBe(true);
            expect(platform.isConsole).toBe(false);
        });

        test("FireTV key mapping", () => {
            let keyCodes = platform.keyCodes;
            expect(platform.getInputAction(18)).toBe(inputActions.menu);
            expect(platform.getInputAction(keyCodes.downArrow)).toBe(inputActions.moveDown);
            expect(platform.getInputAction(keyCodes.leftArrow)).toBe(inputActions.moveLeft);
            expect(platform.getInputAction(keyCodes.rightArrow)).toBe(inputActions.moveRight);
            expect(platform.getInputAction(keyCodes.enter)).toBe(inputActions.select);
            expect(platform.getInputAction(keyCodes.esc)).toBe(inputActions.back);
        });

        test("ad id is supported", () => {
            // We can't actually query the ad id from Jest, but we can ensure that it is assumed to be supported.
            expect(platform.supportsUserAdvertisingId).toBe(true);
        });

        test("test firetv edition modle", () => {
            const platform = new TXMPlatform("Mozilla/5.0 (Linux; Android 7.1.2; AFTJMST12 Build/NS6271; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/70.0.3538.110 Mobile Safari/537.36 cordova-amazon-fireos/3.4.0 AmazonWebAppPlatform/3.4.0;2.0");
            expect(platform.isFireTV).toBe(true);
            expect(platform.name).toBe("FireTV");
            expect(platform.model).toBe("Fire TV Edition - Insignia 4K (2018)");
            expect(platform.modelId).toBe("AFTJMST12");
            expect(platform.version).toBe("7.1.2");
        });
    });

    describe("Android TV Tests", () => {
        let platform = new TXMPlatform("Mozilla/5.0 (Linux; Android 5.1.1) Build/LVY48F; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/70.0.3538.110 Mobile Safari/537.36 cordova-amazon-fireos/3.4.0 AmazonWebAppPlatform/3.4.0;2.0");

        test("recognize the AndroidTV platform", () => {
            expect(platform.isUnknown).toBe(false);
            expect(platform.isFireTV).toBe(false);
            expect(platform.isAndroidTV).toBe(true);
            expect(platform.isVizio).toBe(false);
            expect(platform.isLG).toBe(false);
            expect(platform.isTizen).toBe(false);
            expect(platform.isPS4).toBe(false);
            expect(platform.isXboxOne).toBe(false);
            expect(platform.name).toBe("AndroidTV");
            expect(platform.model).toBe(platform.name);
            expect(platform.version).toBe("5.1.1");
            expect(platform.isCTV).toBe(true);
            expect(platform.isConsole).toBe(false);
        });

        test("AndroidTV key mapping", () => {
            let keyCodes = platform.keyCodes;
            expect(platform.getInputAction(82)).toBe(inputActions.menu);
            expect(platform.getInputAction(keyCodes.downArrow)).toBe(inputActions.moveDown);
            expect(platform.getInputAction(keyCodes.leftArrow)).toBe(inputActions.moveLeft);
            expect(platform.getInputAction(keyCodes.rightArrow)).toBe(inputActions.moveRight);
            expect(platform.getInputAction(keyCodes.enter)).toBe(inputActions.select);
            expect(platform.getInputAction(4)).toBe(inputActions.back);
        });
    });

    describe("Vizio Tests", () => {
        let platform = new TXMPlatform(
            "Mozilla/5.0 (X11; Linux armv7l) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Safari/537.36 CrKey/1.0.999999 VIZIO SmartCast(Conjure/SX7A-2.0.9.0 FW/9.0.5.2 Model/E50x-E1)"
        );

        test("recognize the Vizio platform", () => {
            expect(platform.isUnknown).toBe(false);
            expect(platform.isFireTV).toBe(false);
            expect(platform.isAndroidTV).toBe(false);
            expect(platform.isVizio).toBe(true);
            expect(platform.isLG).toBe(false);
            expect(platform.isTizen).toBe(false);
            expect(platform.isPS4).toBe(false);
            expect(platform.isXboxOne).toBe(false);
            expect(platform.name).toBe("Vizio");
            expect(platform.isCTV).toBe(true);
            expect(platform.isConsole).toBe(false);
            expect(platform.model).toBe("E50x-E1");
            expect(platform.version).toBe("9.0.5.2");
        });

        test("vizio key mapping", () => {
            let keyCodes = platform.keyCodes;
            expect(platform.getInputAction(keyCodes.upArrow)).toBe(inputActions.moveUp);
            expect(platform.getInputAction(keyCodes.downArrow)).toBe(inputActions.moveDown);
            expect(platform.getInputAction(keyCodes.leftArrow)).toBe(inputActions.moveLeft);
            expect(platform.getInputAction(keyCodes.rightArrow)).toBe(inputActions.moveRight);
            expect(platform.getInputAction(keyCodes.enter)).toBe(inputActions.select);
            expect(platform.getInputAction(keyCodes.backspace)).toBe(inputActions.back);
            expect(platform.getInputAction(keyCodes.esc)).toBe(inputActions.exit);
            expect(platform.getInputAction(415)).toBe(inputActions.playPause);
            expect(platform.getInputAction(19)).toBe(inputActions.playPause);
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
        // TODO: afterEach did not seem to work properly, future tests were run
        // before afterEach cleanup calls.
        delete window.PalmSystem;
        delete window.webOS;

        test("recognize the LG platform", () => {
            expect(platform.isUnknown).toBe(false);
            expect(platform.isFireTV).toBe(false);
            expect(platform.isAndroidTV).toBe(false);
            expect(platform.isVizio).toBe(false);
            expect(platform.isLG).toBe(true);
            expect(platform.isTizen).toBe(false);
            expect(platform.isPS4).toBe(false);
            expect(platform.isXboxOne).toBe(false);
            expect(platform.name).toBe("LG");
            expect(platform.model).toBe("LG Fake Model");
            expect(platform.version).toBe("1.2.3");
            expect(platform.isCTV).toBe(true);
            expect(platform.isConsole).toBe(false);
        });

        test("LG key mapping", () => {
            let keyCodes = platform.keyCodes;
            expect(platform.getInputAction(keyCodes.upArrow)).toBe(inputActions.moveUp);
            expect(platform.getInputAction(keyCodes.downArrow)).toBe(inputActions.moveDown);
            expect(platform.getInputAction(keyCodes.leftArrow)).toBe(inputActions.moveLeft);
            expect(platform.getInputAction(keyCodes.rightArrow)).toBe(inputActions.moveRight);
            expect(platform.getInputAction(keyCodes.enter)).toBe(inputActions.select);
            expect(platform.getInputAction(461)).toBe(inputActions.back);
            expect(platform.getInputAction(keyCodes.esc)).toBeFalsy();
            expect(platform.getInputAction(415)).toBe(inputActions.playPause);
            expect(platform.getInputAction(19)).toBe(inputActions.playPause);
            expect(platform.getInputAction(403)).toBe(inputActions.red);
            expect(platform.getInputAction(404)).toBe(inputActions.green);
        });
    });

    describe("Tizen Tests", () => {
        let platform = new TXMPlatform(
            "Mozilla/5.0 (SMART-TV; LINUX; Tizen 4.0) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 TV Safari/537.36"
        );

        test("recognize the Tizen platform", () => {
            expect(platform.isUnknown).toBe(false);
            expect(platform.isFireTV).toBe(false);
            expect(platform.isAndroidTV).toBe(false);
            expect(platform.isVizio).toBe(false);
            expect(platform.isLG).toBe(false);
            expect(platform.isTizen).toBe(true);
            expect(platform.isPS4).toBe(false);
            expect(platform.isXboxOne).toBe(false);
            expect(platform.name).toBe("Tizen");
            expect(platform.model).toBe("2018");
            expect(platform.version).toBe("4.0");
            expect(platform.isCTV).toBe(true);
            expect(platform.isConsole).toBe(false);
        });

        test("Tizen key mapping", () => {
            let keyCodes = platform.keyCodes;
            expect(platform.getInputAction(keyCodes.upArrow)).toBe(inputActions.moveUp);
            expect(platform.getInputAction(keyCodes.downArrow)).toBe(inputActions.moveDown);
            expect(platform.getInputAction(keyCodes.leftArrow)).toBe(inputActions.moveLeft);
            expect(platform.getInputAction(keyCodes.rightArrow)).toBe(inputActions.moveRight);
            expect(platform.getInputAction(keyCodes.enter)).toBe(inputActions.select);
            expect(platform.getInputAction(10009)).toBe(inputActions.back);
            expect(platform.getInputAction(415)).toBe(inputActions.playPause);
            expect(platform.getInputAction(19)).toBe(inputActions.playPause);
            expect(platform.getInputAction(403)).toBe(inputActions.red);
            expect(platform.getInputAction(404)).toBe(inputActions.green);
        });
    });

    describe("PS4 Tests", () => {
        test("recognize the PS4 platform, old version", () => {
            let platform = new TXMPlatform(
                "Mozilla/5.0 (PlayStation 4 5.05) AppleWebKit/601.2 (KHTML, like Gecko)"
            );
            expect(platform.isUnknown).toBe(false);
            expect(platform.isFireTV).toBe(false);
            expect(platform.isAndroidTV).toBe(false);
            expect(platform.isVizio).toBe(false);
            expect(platform.isLG).toBe(false);
            expect(platform.isTizen).toBe(false);
            expect(platform.isPS4).toBe(true);
            expect(platform.isXboxOne).toBe(false);
            expect(platform.name).toBe("PS4");
            expect(platform.model).toBe("PS4");
            expect(platform.version).toBe("5.05");
            expect(platform.isCTV).toBe(false);
            expect(platform.isConsole).toBe(true);
        });

        let platform = new TXMPlatform(
            "Mozilla/5.0 (PlayStation 4 WebMAF) AppleWebKit/601.2 (KHTML, like Gecko) WebMAF/v1.2.30.4-gd34FFEE something extra"
        );

        test("recognize the PS4 platform, new version", () => {
            expect(platform.isUnknown).toBe(false);
            expect(platform.isFireTV).toBe(false);
            expect(platform.isAndroidTV).toBe(false);
            expect(platform.isVizio).toBe(false);
            expect(platform.isLG).toBe(false);
            expect(platform.isTizen).toBe(false);
            expect(platform.isPS4).toBe(true);
            expect(platform.isXboxOne).toBe(false);
            expect(platform.name).toBe("PS4");
            expect(platform.model).toBe("PS4");
            expect(platform.version).toBe("WebMAF/v1.2.30.4");
            expect(platform.isCTV).toBe(false);
            expect(platform.isConsole).toBe(true);
        });

        test("PS4 key mapping", () => {
            let keyCodes = platform.keyCodes;
            expect(platform.getInputAction(keyCodes.upArrow)).toBe(inputActions.moveUp);
            expect(platform.getInputAction(keyCodes.downArrow)).toBe(inputActions.moveDown);
            expect(platform.getInputAction(keyCodes.leftArrow)).toBe(inputActions.moveLeft);
            expect(platform.getInputAction(keyCodes.rightArrow)).toBe(inputActions.moveRight);
            expect(platform.getInputAction(keyCodes.enter)).toBe(inputActions.select);
            expect(platform.getInputAction(keyCodes.esc)).toBe(inputActions.back);
            expect(platform.getInputAction(128)).toBe(inputActions.playPause);
            expect(platform.getInputAction(130)).toBe(inputActions.playPause);
            expect(platform.getInputAction(keyCodes.space)).toBe(inputActions.buttonSquare);
            expect(platform.getInputAction(112)).toBe(inputActions.buttonTriangle);
        });
    });

    describe("XboxOne Tests", () => {
        const xboxUserAgent = "need just 'Xbox' in the user agent";

        test("recognize the XboxOne platform without Windows.* API", () => {
            let platform = new TXMPlatform(xboxUserAgent);

            expect(platform.isUnknown).toBe(false);
            expect(platform.isFireTV).toBe(false);
            expect(platform.isAndroidTV).toBe(false);
            expect(platform.isVizio).toBe(false);
            expect(platform.isLG).toBe(false);
            expect(platform.isTizen).toBe(false);
            expect(platform.isPS4).toBe(false);
            expect(platform.isXboxOne).toBe(true);
            expect(platform.name).toBe("XboxOne");
            expect(platform.model).toBe("Windows.Xbox");
            expect(platform.version).toBe("Unknown");
            expect(platform.isCTV).toBe(false);
            expect(platform.isConsole).toBe(true);
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

            expect(platform.isUnknown).toBe(false);
            expect(platform.isFireTV).toBe(false);
            expect(platform.isAndroidTV).toBe(false);
            expect(platform.isVizio).toBe(false);
            expect(platform.isLG).toBe(false);
            expect(platform.isTizen).toBe(false);
            expect(platform.isPS4).toBe(false);
            expect(platform.isXboxOne).toBe(true);
            expect(platform.name).toBe("XboxOne");
            expect(platform.model).toBe("Windows.Xbox");
            expect(platform.version).toBe("1.2.3");
            expect(platform.isCTV).toBe(false);
            expect(platform.isConsole).toBe(true);
        });

        test("XboxOne key mapping", () => {
            let platform = new TXMPlatform(xboxUserAgent);
            let keyCodes = platform.keyCodes;
            expect(platform.getInputAction(keyCodes.upArrow)).toBe(inputActions.moveUp);
            expect(platform.getInputAction(211)).toBe(inputActions.moveUp);
            expect(platform.getInputAction(203)).toBe(inputActions.moveUp);
            expect(platform.getInputAction(keyCodes.downArrow)).toBe(inputActions.moveDown);
            expect(platform.getInputAction(keyCodes.leftArrow)).toBe(inputActions.moveLeft);
            expect(platform.getInputAction(keyCodes.rightArrow)).toBe(inputActions.moveRight);
            expect(platform.getInputAction(keyCodes.enter)).toBe(inputActions.select);
            expect(platform.getInputAction(keyCodes.esc)).toBe(inputActions.back);
            expect(platform.getInputAction(197)).toBe(inputActions.buttonX);
            expect(platform.getInputAction(198)).toBe(inputActions.buttonY);
            expect(platform.getInputAction(200)).toBe(inputActions.leftShoulder1);
            expect(platform.getInputAction(199)).toBe(inputActions.rightShoulder1);
        });
    });
});
