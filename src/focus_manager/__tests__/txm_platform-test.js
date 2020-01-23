import { inputActions} from "../txm_input_actions";
import { TXMPlatform } from "../txm_platform";

describe("TXMPlatform", () => {

    describe("Unknown (desktop) platform tests", () => {
        let platform = new TXMPlatform();

        test("recognize the Unknown platform", () => {
            expect(platform.isUnknown).toBe(true);
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
    });

    describe("Vizio Tests", () => {
        let platform = new TXMPlatform(
            "Mozilla/5.0 (X11; Linux armv7l) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Safari/537.36 CrKey/1.0.999999 VIZIO SmartCast(Conjure/SX7A-2.0.9.0 FW/9.0.5.2 Model/E50x-E1)"
        );

        test("recognize the Vizio platform", () => {
            expect(platform.isUnknown).toBe(false);
            expect(platform.isVizio).toBe(true);
            expect(platform.isLG).toBe(false);
            expect(platform.isTizen).toBe(false);
            expect(platform.isPS4).toBe(false);
            expect(platform.isXboxOne).toBe(false);
            expect(platform.name).toBe("Vizio");
            expect(platform.isCTV).toBe(true);
            expect(platform.isConsole).toBe(false);
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
        let platform = new TXMPlatform(
            "Mozilla/5.0 (PlayStation 4 5.05) AppleWebKit/601.2 (KHTML, like Gecko)"
        );

        test("recognize the PS4 platform", () => {
            expect(platform.isUnknown).toBe(false);
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

        let platform = new TXMPlatform();

        // Should no longer be needed.
        delete window.Windows;

        test("recognize the XboxOne platform", () => {
            expect(platform.isUnknown).toBe(false);
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