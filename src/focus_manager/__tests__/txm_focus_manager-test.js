import { inputActions} from "../txm_input_actions";
import { Focusable} from "../txm_focusable";
import { TXMFocusManager } from "../txm_focus_manager";
import { keyCodes } from "../txm_platform";

describe("TXMFocusManager", () => {
    function newFocusableStub(id) {
        const element = {id, bounds: {}};
        element.classList = {
            add: () => {},
            remove: () => {}
        };
        element.getBoundingClientRect = () => element.bounds;
        const f = new Focusable(element);
        f.setBounds = function({x = 0, y = 0, w = 10, h = 10} = {}) {
            this.element.bounds = {top: y, left: x, right: x + w, bottom: y + h, width: w, height: h};
        };
        f.setBounds();
        return f;
    }

    function newFocusRow({x, y, w = 10, h = 10}, ...focuses) {
        focuses.forEach(f => {
            if (f) f.setBounds({x, y, w, h});
            x += w + 10;
        });
        return focuses;
    }

    function testInput(focusManager, currFocus, action, newFocus) {
        focusManager.setFocus(currFocus);
        focusManager.onInputAction(action);
        expect(focusManager.currentFocus).toBe(newFocus);
    }

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

    test("key event throttling", ()=> {
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

    describe("focus manager navigation", () => {
        let focuses = [];
        for (let i = 0; i <= 10; i++) {
            let f = newFocusableStub(`focuses${i}`);
            focuses.push(f);
        }

        test("test default focus", () => {
            const fm = new TXMFocusManager();
            fm.setContentFocusables(newFocusRow({x: 10, y: 10}, focuses[1], focuses[2], focuses[3]));

            // Default focus.
            testInput(fm, undefined, inputActions.moveDown, focuses[1]);
        });

        describe("test current focus not in content or chrome focusables", () => {
            const fm = new TXMFocusManager();
            fm.setContentFocusables(newFocusRow({x: 10, y: 10}, focuses[1], focuses[2], focuses[3]));

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

        describe("simple left/right focus navigation", () => {
            const fm = new TXMFocusManager();
            fm.setContentFocusables(newFocusRow({x: 10, y: 10}, focuses[1], focuses[2], focuses[3]));
            expect(fm.currentFocus).toBe(focuses[1]);

            test("No loss of focus moving down off row", () => {
                testInput(fm, focuses[1], inputActions.moveDown, focuses[1]);
            });

            test("basic move right", () => {
                testInput(fm, focuses[1], inputActions.moveRight, focuses[2]);
                testInput(fm, focuses[2], inputActions.moveRight, focuses[3]);
            });

            test("No loss of focus moving right off of right side", () => {
                testInput(fm, focuses[3], inputActions.moveRight, focuses[3]);
            });

            test("basic move left", () => {
                testInput(fm, focuses[3], inputActions.moveLeft, focuses[2]);
                testInput(fm, focuses[2], inputActions.moveLeft, focuses[1]);
            });

            test("No loss of focus moving left off of left side", () => {
                testInput(fm, focuses[1], inputActions.moveLeft, focuses[1]);
            });
        });

        describe("2D grid focus content navigation, no chrome", () => {
            const fm = new TXMFocusManager();
            fm.setTopChromeFocusables([]);
            fm.setBottomChromeFocusables([]);
            fm.setContentFocusables(
                newFocusRow({x: 10, y: 10},                   focuses[1], focuses[2], focuses[3])
                  .concat(newFocusRow({x: 10, y: 30},         focuses[4], undefined, focuses[5]))
                  .concat(newFocusRow({x: 10, y: 50, w: 100}, focuses[6])) // covers entire logical row
            );

            // default initial focus is first content item
            expect(fm.currentFocus).toBe(focuses[1]);

            test("no loss of focus moving up off of the top edge", () => {
                testInput(fm, focuses[1], inputActions.moveUp, focuses[1]);
            });

            test("no loss of focus moving left off of the left edge", () => {
                testInput(fm, focuses[1], inputActions.moveLeft, focuses[1]);
            });

            test("moving right", () => {
                testInput(fm, focuses[1], inputActions.moveRight, focuses[2]);
            });

            test("skip down over middle hole in focusables grid", () => {
                testInput(fm, focuses[2], inputActions.moveDown, focuses[6]);

                // moving down along right column doesn't have a hole though
                testInput(fm, focuses[3], inputActions.moveDown, focuses[5]);
            });

            test("skip left over middle hole in focusables grid", () => {
                testInput(fm, focuses[5], inputActions.moveLeft, focuses[4]);
            });

            test("move down and back up left column", () => {
                testInput(fm, focuses[4], inputActions.moveDown, focuses[6]);
                testInput(fm, focuses[6], inputActions.moveUp, focuses[4]);
                testInput(fm, focuses[4], inputActions.moveUp, focuses[1]);
            });

            test("loss of context when move down to bottom row from right column and back up left column", () => {
                testInput(fm, focuses[5], inputActions.moveDown, focuses[6]);
                testInput(fm, focuses[6], inputActions.moveUp, focuses[4]);
            });
        });

        describe("chrome to content navigation", () => {
            const fm = new TXMFocusManager();

            let topChrome = [];
            let bottomChrome = [];
            for (let i = 1; i <= 3; i++) {
                topChrome[i] = new Focusable();
                topChrome[i].id = `topChrome${i}`;
                bottomChrome[i] = new Focusable();
                bottomChrome[i].id = `bottomChrome${i}`;
            }
            fm.setTopChromeFocusables([topChrome[1], topChrome[2], topChrome[3]]);
            fm.setBottomChromeFocusables([bottomChrome[1], bottomChrome[2]]);
            fm.setContentFocusables([
                focuses[1], focuses[2], focuses[3],
                focuses[4]
            ]);

            // default initial focus is first content item"
            expect(fm.currentFocus).toBe(focuses[1]);

            test("default focus on movement is in content area", () => {
                testInput(fm, undefined, inputActions.moveLeft, focuses[1]);
            });

            test("no loss of focus moving left off the left edge of top chrome", () => {
                testInput(fm, topChrome[1], inputActions.moveLeft, topChrome[1]);
            });

            test("move right along top chrome", () => {
                testInput(fm, topChrome[1], inputActions.moveRight, topChrome[2]);
                testInput(fm, topChrome[2], inputActions.moveRight, topChrome[3]);
            });

            test("no loss of focus moving right or up off the right edge of top chrome", () => {
                testInput(fm, topChrome[3], inputActions.moveRight, topChrome[3]);
                testInput(fm, topChrome[3], inputActions.moveUp, topChrome[3]);
            });

            test("moving down from top chrome goes to first content focus", () => {
                testInput(fm, topChrome[3], inputActions.moveLeft, topChrome[2]);
                testInput(fm, topChrome[2], inputActions.moveDown, focuses[1]);
            });

            test("moving down within content stays within content focusables", () => {
                testInput(fm, focuses[1], inputActions.moveDown, focuses[4]);
                testInput(fm, focuses[4], inputActions.moveDown, focuses[1]);
                testInput(fm, focuses[1], inputActions.moveDown, focuses[4]);
            });

            test("moving down from last content row moves down to first bottom chrome", () => {
                testInput(fm, focuses[4], inputActions.moveDown, bottomChrome[1]);
            });

            test("no loss of focus moving down from last bottom chrome row", () => {
                testInput(fm, bottomChrome[1], inputActions.moveDown, bottomChrome[1]);
            });

            test("moving within bottom chrome works", () => {
                testInput(fm, bottomChrome[1], inputActions.moveRight, bottomChrome[2]);
            });

            test("moving up from bottom chrome moves to last saved content focus", () => {
                testInput(fm, focuses[2], inputActions.moveDown, bottomChrome[2]);

                fm.navigateToNewFocus(inputActions.moveUp);
                expect(fm.currentFocus).toBe(focuses[2]);

                fm.navigateToNewFocus(inputActions.moveUp);
                expect(fm.currentFocus).toBe(focuses[2]);

                fm.navigateToNewFocus(inputActions.moveDown);
                expect(fm.currentFocus).toBe(bottomChrome[2]);

                fm.navigateToNewFocus(inputActions.moveUp);
                expect(fm.currentFocus).toBe(focuses[2]);
            });

            test("moving up from bottom chrome moves to default content focus", () => {
                // Start initially in the bottom chrome, simulate a replace step that resets the content.
                fm.setFocus(bottomChrome[2]);
                fm.setContentFocusables([focuses[1], focuses[2], focuses[3]], focuses[3]);

                fm.navigateToNewFocus(inputActions.moveUp);
                expect(fm.currentFocus).toBe(focuses[3]);

                fm.navigateToNewFocus(inputActions.moveDown);
                expect(fm.currentFocus).toBe(bottomChrome[2]);

                fm.navigateToNewFocus(inputActions.moveUp);
                expect(fm.currentFocus).toBe(focuses[3]);
            });

            test("moving up from chrome moves to last saved top chrome focus", () => {
                fm.navigateToNewFocus(inputActions.moveUp);
                expect(fm.currentFocus).toBe(topChrome[2]);
            });

            test("moving back down from top chrome moves to last saved content focus again", () => {
                fm.setFocus(topChrome[1]);
                fm.setContentFocusables([focuses[1], focuses[2], focuses[3]], focuses[2]);
                fm.navigateToNewFocus(inputActions.moveDown);
                expect(fm.currentFocus).toBe(focuses[2]);
            });
        });
    });
});
