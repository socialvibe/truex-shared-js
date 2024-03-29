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
        mouseEnter.screenX = 2;
        mouseEnter.screenY = 2;

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

    describe("test focus mouse events enabled/disabled", () => {
        const fm = new TXMFocusManager();

        const selectAction = jest.fn();

        var mouseEnabled = true;

        function testMouseEnabled() {
            return mouseEnabled;
        }

        const testDiv = document.createElement("div");
        testDiv.id = "clickableFocus";
        testDiv.className = "coolButton";
        document.body.appendChild(testDiv);

        const clickableFocus = new Focusable(testDiv, selectAction);

        var lastHasFocus;
        var lastFocusChange
        clickableFocus.onFocusSet = function(hasFocus, focusChange) {
            lastHasFocus = hasFocus;
            lastFocusChange = focusChange;
        }

        clickableFocus.addMouseEventListeners(fm, testMouseEnabled);

        const mouseEnter = document.createEvent('Event');
        mouseEnter.initEvent("mouseenter", true, true);
        mouseEnter.screenX = 1;
        mouseEnter.screenY = 1;

        clickableFocus.element.dispatchEvent(mouseEnter);
        expect(fm.currentFocus).toBe(clickableFocus);

        // Verify onFocusSet callback args with mouse related focus changes.
        expect(lastHasFocus).toBe(true);
        expect(lastFocusChange && lastFocusChange.oldFocus).toBe(undefined);
        expect(lastFocusChange && lastFocusChange.newFocus).toBe(clickableFocus);
        expect(lastFocusChange && lastFocusChange.action).toBe(undefined);
        expect(lastFocusChange && lastFocusChange.event && lastFocusChange.event.type).toBe('mouseenter');

        const mouseClick = document.createEvent('Event');
        mouseClick.initEvent("click", true, true);

        clickableFocus.element.dispatchEvent(mouseClick);
        expect(selectAction).toHaveBeenCalled();

        // Mouse events should now be ignored:
        mouseEnabled = false;
        selectAction.mockClear();
        lastHasFocus = undefined;
        lastFocusChange = undefined;

        clickableFocus.element.dispatchEvent(mouseClick);
        expect(fm.currentFocus).toBe(clickableFocus);
        expect(selectAction).not.toHaveBeenCalled();

        fm.setFocus(undefined, 'fake-action');

        expect(lastHasFocus).toBe(false);
        expect(lastFocusChange && lastFocusChange.oldFocus).toBe(clickableFocus);
        expect(lastFocusChange && lastFocusChange.newFocus).toBe(undefined);
        expect(lastFocusChange && lastFocusChange.action).toBe('fake-action');
        expect(lastFocusChange && lastFocusChange.event).toBe(undefined);

        clickableFocus.element.dispatchEvent(mouseEnter);
        expect(fm.currentFocus).toBe(undefined);
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
                20, 20, 20, 20, 21, // here
                101, // here
                10, 10, 10, 10, 10, 10, 10, 10, 10, 11 // here
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
            const tolerance = 46;
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

    describe("basic navigation", () => {
        // Creates a focusable element stub that has a specified position and size.
        function newFocusable(id, x, y, w, h) {
            const element = {
                id,
                classList: {
                    add: () => {},
                    remove: () => {}
                },
                getBoundingClientRect: () => {
                    return {x, y, width: w, height: h, top: y, left: x, right: x + w, bottom: y + h};
                }
            };
            const f = new Focusable(element);
            f.onFocusSet = function(hasFocus, focusChange) {
              f.hasFocus = hasFocus;
              f.focusChange = focusChange;
            };
            return f;
        }

        function newFocusRows(...rowBounds) {
            const focuses = [];
            rowBounds.forEach(row => {
                const count = row.count || 1;
                var x = row.x || 0;
                const y = row.y || 0;
                const w = row.w || row.width || 10;
                const h = row.h || row.height || 10;
                const gap = row.gap || 10;
                const prefix = row.prefix || 'focuses';
                for(var i = 0; i < count; i++) {
                    const index = focuses.length;
                    const id = prefix + '[' + index + ']';
                    focuses.push(newFocusable(id, x, y, w, h));
                    x += w + gap;
                }
            })
            return focuses;
        }

        const focuses = newFocusRows(
          {}, // placeholder
          {x: 10, y: 10, count: 3},
          {x: 10, y: 30, gap: 30, count: 2}, // make larger gap between the two
          {x: 10, y: 50, w: 100, count: 2} // span the above columns with the first item
        );

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
            expect(fm.currentFocus).toBe(focuses[1]); // defaults to top left visual focus regardless of input order

            fm.setContentFocusables([focuses[2], focuses[1]], focuses[2]);
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
            fm.setContentFocusables([focuses[1], focuses[2], focuses[3]]);

            test("No loss of focus moving down off row", () => {
                fm.onInputAction(inputActions.moveDown);
                expect(fm.currentFocus).toBe(focuses[1]);
            });

            test("basic move right", () => {
                fm.onInputAction(inputActions.moveRight);
                expect(fm.currentFocus).toBe(focuses[2]);

                fm.onInputAction(inputActions.moveRight);
                expect(fm.currentFocus).toBe(focuses[3]);

                // Verify onFocusSet callback args.
                expect(focuses[2].hasFocus).toBe(false);
                expect(focuses[3].hasFocus).toBe(true);
                expect(focuses[2].focusChange).toBe(focuses[3].focusChange);
                expect(focuses[3].focusChange.oldFocus).toBe(focuses[2]);
                expect(focuses[3].focusChange.newFocus).toBe(focuses[3]);
                expect(focuses[3].focusChange.action).toBe(inputActions.moveRight);
                expect(focuses[3].focusChange.event).toBe(undefined);
            });

            test("No loss of focus moving right off of right side", () => {
                fm.onInputAction(inputActions.moveRight);
                expect(fm.currentFocus).toBe(focuses[3]);
            });

            test("basic move left", () => {
                fm.onInputAction(inputActions.moveLeft);
                expect(fm.currentFocus).toBe(focuses[2]);

                fm.onInputAction(inputActions.moveLeft);
                expect(fm.currentFocus).toBe(focuses[1]);
            });

            test("No loss of focus moving left off of left side", () => {
                fm.onInputAction(inputActions.moveLeft);
                expect(fm.currentFocus).toBe(focuses[1]);
            });
        });

        describe("2D grid focus content navigation, no chrome", () => {
            const fm = new TXMFocusManager();

            fm.setTopChromeFocusables([]);
            fm.setBottomChromeFocusables([]);
            fm.setContentFocusables([
                [focuses[1], focuses[2], focuses[3]],
                [focuses[4], undefined, focuses[5]],
                focuses[6], // covers entire logical row
            ]);

            test("default initial focus is first content item", () => {
                expect(fm.currentFocus).toBe(focuses[1]);
            });

            test("no loss of focus moving up off of the top edge", () => {
                fm.onInputAction(inputActions.moveUp);
                expect(fm.currentFocus).toBe(focuses[1]);
            });

            test("no loss of focus moving left off of the left edge", () => {
                fm.onInputAction(inputActions.moveLeft);
                expect(fm.currentFocus).toBe(focuses[1]);
            });

            test("no loss of focus moving left off of the left edge", () => {
                fm.onInputAction(inputActions.moveRight);
                expect(fm.currentFocus).toBe(focuses[2]);
            });

            test("skip down over middle hole in focusables grid", () => {
                expect(fm.currentFocus).toBe(focuses[2]);
                fm.onInputAction(inputActions.moveDown);
                expect(fm.currentFocus).toBe(focuses[6]);

                // moving down along right column doesn't have a hole though
                fm.setFocus(focuses[3]);
                fm.onInputAction(inputActions.moveDown);
                expect(fm.currentFocus).toBe(focuses[5]);
            });

            test("skip left over middle hole in focusables grid", () => {
                fm.onInputAction(inputActions.moveLeft);
                expect(fm.currentFocus).toBe(focuses[4]);
            });

            test("move down and back up left column", () => {
                fm.onInputAction(inputActions.moveDown);
                expect(fm.currentFocus).toBe(focuses[6]);

                fm.onInputAction(inputActions.moveUp);
                expect(fm.currentFocus).toBe(focuses[4]);

                fm.onInputAction(inputActions.moveUp);
                expect(fm.currentFocus).toBe(focuses[1]);
            });

            test("loss of context when move down to bottom row from right column and back up left column", () => {
                fm.setFocus(focuses[5]);
                fm.onInputAction(inputActions.moveDown);
                expect(fm.currentFocus).toBe(focuses[6]);

                fm.onInputAction(inputActions.moveUp);
                expect(fm.currentFocus).toBe(focuses[4]);
            });
        });

        describe("chrome to content navigation", () => {
            const fm = new TXMFocusManager();
            const topChrome = newFocusRows({x: 0, y: 0, prefix: 'topChrome', count: 4});
            const bottomChrome = newFocusRows({x: 0, y: 100, prefix: 'bottomChrome', count: 4});

            fm.setTopChromeFocusables([topChrome[1], topChrome[2], topChrome[3]]);
            fm.setBottomChromeFocusables([bottomChrome[1], bottomChrome[2]]);
            fm.setContentFocusables([
                [focuses[1], focuses[2], focuses[3]],
                focuses[4]
            ]);

            test("default initial focus is first content item", () => {
                expect(fm.currentFocus).toBe(focuses[1]);
            });

            test("default focus on movement is in content area", () => {
                fm.setFocus(undefined);
                fm.navigateToNewFocus(inputActions.moveLeft);
                expect(fm.currentFocus).toBe(focuses[1]);
            });

            test("no loss of focus moving left off the left edge of top chrome", () => {
                fm.setFocus(topChrome[1]);
                fm.navigateToNewFocus(inputActions.moveLeft);
                expect(fm.currentFocus).toBe(topChrome[1]);
            });

            test("move right along top chrome", () => {
                fm.navigateToNewFocus(inputActions.moveRight);
                expect(fm.currentFocus).toBe(topChrome[2]);

                fm.navigateToNewFocus(inputActions.moveRight);
                expect(fm.currentFocus).toBe(topChrome[3]);
            });

            test("no loss of focus moving right or up off the right edge of top chrome", () => {
                fm.navigateToNewFocus(inputActions.moveRight);
                expect(fm.currentFocus).toBe(topChrome[3]);

                fm.navigateToNewFocus(inputActions.moveUp);
                expect(fm.currentFocus).toBe(topChrome[3]);
            });

            test("moving down from top chrome goes to first content focus", () => {
                // establish last saved top focus for later
                fm.navigateToNewFocus(inputActions.moveLeft);
                expect(fm.currentFocus).toBe(topChrome[2]);

                fm.navigateToNewFocus(inputActions.moveDown);
                expect(fm.currentFocus).toBe(focuses[1]);
            });

            test("moving down within content stays within content focusables", () => {
                fm.navigateToNewFocus(inputActions.moveDown);
                expect(fm.currentFocus).toBe(focuses[4]);

                fm.navigateToNewFocus(inputActions.moveUp);
                expect(fm.currentFocus).toBe(focuses[1]);

                fm.navigateToNewFocus(inputActions.moveDown);
                expect(fm.currentFocus).toBe(focuses[4]);
            });

            test("moving down from last content row moves down to first bottom chrome", () => {
                fm.navigateToNewFocus(inputActions.moveDown);
                expect(fm.currentFocus).toBe(bottomChrome[1]);
            });

            test("no loss of focus moving down from last bottom chrome row", () => {
                fm.navigateToNewFocus(inputActions.moveDown);
                expect(fm.currentFocus).toBe(bottomChrome[1]);
            });

            test("moving within bottom chrome works", () => {
                fm.navigateToNewFocus(inputActions.moveRight);
                expect(fm.currentFocus).toBe(bottomChrome[2]);
            });

            test("moving up from bottom chrome moves to last saved content focus", () => {
                fm.setContentFocusables([focuses[1], focuses[2], focuses[3]]);
                fm.setFocus(focuses[2]);
                fm.setFocus(bottomChrome[2]);

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

        describe("custom default chrome focusables", () => {
            const fm = new TXMFocusManager();
            const topChrome = newFocusRows({x: 0, y: 0, prefix: 'topChrome', count: 4});
            const bottomChrome = newFocusRows({x: 0, y: 100, prefix: 'bottomChrome', count: 4});
            fm.setTopChromeFocusables([topChrome[1], topChrome[2], topChrome[3]], topChrome[2]);
            fm.setBottomChromeFocusables([bottomChrome[1], bottomChrome[2]], bottomChrome[2]);
            fm.setContentFocusables([focuses[1], focuses[2], focuses[3]], focuses[2]);

            test("move from content to default top chrome focus", () => {
                fm.setFocus(focuses[1]);

                fm.navigateToNewFocus(inputActions.moveUp);
                expect(fm.currentFocus).toBe(topChrome[2]);

                fm.navigateToNewFocus(inputActions.moveDown);
                expect(fm.currentFocus).toBe(focuses[1]);
            });

            test("move from content to default bottom chrome focus", () => {
                fm.setFocus(focuses[1]);

                fm.navigateToNewFocus(inputActions.moveDown);
                expect(fm.currentFocus).toBe(bottomChrome[2]);

                fm.navigateToNewFocus(inputActions.moveUp);
                expect(fm.currentFocus).toBe(focuses[1]);
            });

            test("overall default focus and use customized chrome focusables", () => {
                fm.setFocus(focuses[3]);
                expect(fm.getDefaultFocus()).toBe(focuses[3]);

                fm.setContentFocusables(undefined);
                expect(fm.getDefaultFocus()).toBe(topChrome[2]);

                fm.setTopChromeFocusables(undefined);
                expect(fm.getDefaultFocus()).toBe(bottomChrome[2]);
            });
        });
    });
});
