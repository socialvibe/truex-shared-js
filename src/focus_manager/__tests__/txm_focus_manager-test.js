import { inputActions} from "../txm_input_actions";
import { Focusable} from "../txm_focusable";
import { TXMFocusManager } from "../txm_focus_manager";
import { keyCodes } from "../txm_platform";

describe("TXMFocusManager", () => {
    let testDiv1 = document.createElement("div");
    testDiv1.id = "focus1";
    let focus1 = new Focusable(testDiv1);
    document.body.appendChild(testDiv1);

    let testDiv2 = document.createElement("div");
    testDiv2.id = "focus2";
    testDiv2.className = "coolButton";
    let focus2 = new Focusable(testDiv2);
    document.body.appendChild(testDiv2);

    let testDiv3 = document.createElement("div");
    testDiv3.id = "focus3";
    testDiv3.className = "coolButton";
    document.body.appendChild(testDiv3);

    let testDiv4 = document.createElement("div");
    testDiv4.id = "focus4";
    testDiv4.className = "coolButton";
    document.body.appendChild(testDiv4);

    const keyEvent = document.createEvent('Event');
    keyEvent.initEvent("keydown", true, true);
    keyEvent.keyCode = keyCodes.space;

    const focuses = [];
    for (let i = 0; i <= 10; i++) {
        let f = new Focusable();
        f.id = `focuses${i}`;
        focuses.push(f);
    }

    test("Focusable element DOM references", () => {
        expect(focus1.element).toBe(testDiv1);
        expect(focus2.element).toBe(testDiv2);
    });

    test("Focusable element querySelector string references", () => {
        expect(new Focusable("#focus1").element).toBe(testDiv1);
        expect(new Focusable(".coolButton").element).toBe(testDiv2);
        expect(new Focusable("body").element).toBe(document.body);
    });

    describe("focus manager current focus", () => {
        const fm = new TXMFocusManager();

        test("test initial focus", () => {
            fm.setFocus(undefined);
            expect(fm.currentFocus).toBe(undefined);
        });

        test("test focus set", () => {
            fm.setFocus(focus1);
            expect(fm.currentFocus).toBe(focus1);
            expect(focus1.element.className).toBe("hasFocus");
            expect(focus2.element.className).toBe("coolButton");
        });

        test("test focus switch", () => {
            fm.setFocus(focus2);
            expect(fm.currentFocus).toBe(focus2);
            expect(focus1.element.className).toBe("");
            expect(focus2.element.className).toBe("coolButton hasFocus");
        });

        test("test focus clear", () => {
            fm.setFocus(null);
            expect(fm.currentFocus).toBe(undefined);
            expect(focus1.element.className).toBe("");
            expect(focus2.element.className).toBe("coolButton");
        });
    });

    describe("test focus mouse events", () => {
        const fm = new TXMFocusManager();

        const selectAction = jest.fn();
        const inputAction = jest.fn();

        let focus3 = new Focusable(testDiv3, selectAction, inputAction);
        focus3.addMouseEventListeners(fm);

        const mouseEnter = document.createEvent('Event');
        mouseEnter.initEvent("mouseenter", true, true);

        focus3.element.dispatchEvent(mouseEnter);
        expect(fm.currentFocus).toBe(focus3);

        const mouseClick = document.createEvent('Event');
        mouseClick.initEvent("click", true, true);

        focus3.element.dispatchEvent(mouseClick);
        expect(selectAction).toHaveBeenCalled();
        expect(inputAction).not.toHaveBeenCalled();

        selectAction.mockClear();
        inputAction.mockClear();

        focus3.onSelectAction = undefined;

        focus3.element.dispatchEvent(mouseClick);
        expect(selectAction).not.toHaveBeenCalled();
        expect(inputAction).toHaveBeenCalledWith(inputActions.select, mouseClick);

        // Test via constructor.
        let focus4 = new Focusable(testDiv4, selectAction, inputAction, fm);

        selectAction.mockClear();
        inputAction.mockClear();

        focus4.element.dispatchEvent(mouseClick);
        expect(selectAction).toHaveBeenCalled();
        expect(inputAction).not.toHaveBeenCalled();
    });

    describe("focus manager optional onSelectAction callback", () => {
        const fm = new TXMFocusManager();
        fm.keyThrottleDelay = 0; // disable throttling for this test

        test("onSelectAction callback should only happen on focus1", () => {
            focus1.onSelectAction = jest.fn();
            focus1.onInputAction = jest.fn();
            focus2.onSelectAction = jest.fn();

            fm.setFocus(focus1);
            fm.onKeyDown(keyEvent);

            expect(focus1.onSelectAction).toHaveBeenCalledWith(keyEvent);
            expect(focus1.onInputAction).not.toHaveBeenCalled();
            expect(focus2.onSelectAction).not.toHaveBeenCalled();
        });

        test("switch to focus2, onSelectAction callback should now only happen on focus2", () => {
            fm.setFocus(focus2);

            focus1.onSelectAction = jest.fn();
            focus2.onSelectAction = jest.fn();

            fm.onKeyDown(keyEvent);

            expect(focus1.onSelectAction).not.toHaveBeenCalled()
            expect(focus2.onSelectAction).toHaveBeenCalledWith(keyEvent);
        });

        test("non-functional onSelectAction should cause a warning, no crash", () => {
            focus2.onSelectAction = "non-function";
            let oldWarn = console.warn;
            console.warn = jest.fn();

            fm.onKeyDown(keyEvent);

            expect(console.warn).toHaveBeenCalled()

            console.warn = oldWarn;
        });
    });

    test("key event throttling", () => {
        const fm = new TXMFocusManager();
        fm.keyThrottleDelay = 100; // ensure throttling for this test
        fm.onInputAction = jest.fn();
        fm.onKeyDown(keyEvent);
        expect(fm.onInputAction).toHaveBeenCalledTimes(1);
        fm.onKeyDown(keyEvent);
        fm.onKeyDown(keyEvent);
        fm.onKeyDown(keyEvent);
        fm.onKeyDown(keyEvent);
        expect(fm.onInputAction).toHaveBeenCalledTimes(1);

        return new Promise((resolve, reject) => {
            // Eventually a new key event gets past the threshold and resets the timeouts.
            const keysTimesLeft = [
                20, 20, 20, 20, 20, // here
                100, // here
                10, 10, 10, 10, 10, 10, 10, 10, 10, 10 // here
            ];
            waitForNextKey();

            function waitForNextKey() {
                const keyDelay = keysTimesLeft.shift();
                if (keyDelay) {
                    setTimeout(() => {
                        fm.onKeyDown(keyEvent);
                        waitForNextKey();
                    }, keyDelay);
                } else {
                    expect(fm.onInputAction).toHaveBeenCalledTimes(4);
                    resolve();
                }
            }
        });
    });

    test("focus manager onInputAction callback", () => {
        const fm = new TXMFocusManager();
        fm.keyThrottleDelay = 0; // disable throttling for this test

        focus1.onSelectAction = undefined;
        focus2.onSelectAction = undefined;

        focus1.onInputAction = jest.fn();
        focus2.onInputAction = jest.fn();

        fm.setFocus(focus1);

        fm.onKeyDown(keyEvent);

        expect(focus1.onInputAction).toHaveBeenCalledWith(inputActions.select, keyEvent);
        expect(focus2.onInputAction).not.toHaveBeenCalled();

        fm.setFocus(focus2);

        focus1.onInputAction = jest.fn();
        focus2.onInputAction = jest.fn();

        fm.onKeyDown(keyEvent);

        expect(focus1.onInputAction).not.toHaveBeenCalled()
        expect(focus2.onInputAction).toHaveBeenCalledWith(inputActions.select, keyEvent);
    });

    test("focus manager action injection", () => {
        jest.setTimeout(10 * 1000);

        const fm = new TXMFocusManager();
        fm.keyThrottleDelay = 0; // disable throttling for this test
        fm.setFocus(focus1);

        const injectedActions = [];
        const injectionDelays = [];

        var lastTime = Date.now();

        // We just need to verify that actions are dispatched at reasonable times.
        fm.onInputAction = action => {
            injectedActions.push(action);
            const now = new Date();
            const delay = now - lastTime;
            injectionDelays.push(delay);
            lastTime = now;
            const hhmmss = now.toISOString().split('T')[1].split('.')[0];
            console.log(`${hhmmss}: injected ${action} after delay ${delay}`);
        };

        let verifyDelay = (actual, expected) => {
            const tolerance = 40;
            expect(actual).toBeGreaterThan(expected - tolerance);
            expect(actual).toBeLessThan(expected + tolerance);
        };

        return fm.inject(1000, inputActions.select)
        .then(focusPath => {
            expect(focusPath).toBe('#focus1');

            return fm.inject(0, inputActions.moveRight, 0, inputActions.moveLeft)
        })
        // verify we can also inject an explicit array
        .then(() => fm.inject([inputActions.moveLeft, 500, inputActions.moveRight]))
        .then(() => {
            fm.setFocus(focus2);
            return fm.inject(inputActions.moveDown)
        })
        .then(focusPath => {
            expect(focusPath).toBe('#focus2');
            return fm.inject(500, inputActions.back)
        })
        .then(() => {
            expect(injectedActions).toEqual([
                inputActions.select,
                inputActions.moveRight, inputActions.moveLeft,
                inputActions.moveLeft, inputActions.moveRight,
                inputActions.moveDown,
                inputActions.back]);

            verifyDelay(injectionDelays[0], 1000);
            verifyDelay(injectionDelays[1], 0);
            verifyDelay(injectionDelays[2], 0);
            verifyDelay(injectionDelays[3], 0);
            verifyDelay(injectionDelays[4], 500);
            verifyDelay(injectionDelays[5], 0);
            verifyDelay(injectionDelays[6], 500);
        });
    });

    test("focus manager getCurrentFocusPath", () => {
        // We only need to verify the connection to getElementPath
        const fm = new TXMFocusManager();

        expect(fm.getCurrentFocusPath()).toBe(undefined);

        fm.setFocus(focus1);
        expect(fm.getCurrentFocusPath()).toBe('#focus1');
    });

    test("focus manager onVideoAction callback", () => {
        const fm = new TXMFocusManager();

        // Use a <video> stub.
        let video = {
            localName: 'video',
            classList: {add: function() {}, remove: function() {}},
            paused: true,
            play: jest.fn(),
            pause: jest.fn()
        };

        let videoFocus = new Focusable(video);
        fm.setFocus(videoFocus);

        fm.onKeyDown(keyEvent);

        expect(video.play).toHaveBeenCalled();
        expect(video.pause).not.toHaveBeenCalled();

        video.paused = false;
        video.play.mockClear();
        video.pause.mockClear();

        fm.onInputAction(inputActions.playPause);

        expect(video.play).not.toHaveBeenCalled();
        expect(video.pause).toHaveBeenCalled();
    });


    test("test default focus", () => {
        const fm = new TXMFocusManager();
        fm.setContentFocusables([focuses[1], focuses[2], focuses[3]]);

        // Default focus.
        fm.setFocus(undefined);
        fm.onInputAction(inputActions.moveDown);
        expect(fm.currentFocus).toBe(focuses[1]);
    });

    describe("test current focus not in content or chrome focusables", () => {
        const fm = new TXMFocusManager();
        fm.setContentFocusables([focuses[1], focuses[2], focuses[3]]);

        let extraFocusable = new Focusable();
        extraFocusable.id = "extraFocusable";

        fm.setFocus(extraFocusable);

        test("extra focus still receives inputs", () => {
            extraFocusable.onSelectAction = jest.fn();
            fm.onInputAction(inputActions.select);
            expect(extraFocusable.onSelectAction).toHaveBeenCalled();
        });

        test("navigating from extra focus goes to first focus", () => {
            fm.onInputAction(inputActions.moveRight);
            expect(fm.currentFocus).toBe(focuses[1]);
        });
    });

    test("test content focusables vs current focus", () => {
        const fm = new TXMFocusManager();

        fm.setContentFocusables([focuses[1], focuses[2], focuses[3]]);
        expect(fm.currentFocus).toBe(focuses[1]);

        fm.setContentFocusables([focuses[1], focuses[2], focuses[3]], focuses[3]);
        expect(fm.currentFocus).toBe(focuses[3]);

        fm.setContentFocusables([focuses[2], focuses[1]]);
        expect(fm.currentFocus).toBe(focuses[2]);

        fm.setTopChromeFocusables([focuses[1], focuses[2]]);
        fm.setFocus(focuses[1]);
        fm.setContentFocusables([focuses[3], focuses[4]]);
        expect(fm.currentFocus).toBe(focuses[1]); // chrome focus unchanged

        fm.setBottomChromeFocusables([focuses[5], focuses[6]]);
        fm.setFocus(focuses[5]);
        fm.setContentFocusables([focuses[3], focuses[4]]);
        expect(fm.currentFocus).toBe(focuses[5]); // chrome focus unchanged

        fm.setFocus(null);
        fm.setContentFocusables([focuses[3], focuses[4]]);
        expect(fm.currentFocus).toBe(focuses[3]); // now it can take effect

        fm.setContentFocusables([focuses[3], focuses[4]], focuses[4]);
        expect(fm.currentFocus).toBe(focuses[4]);
    });
});
