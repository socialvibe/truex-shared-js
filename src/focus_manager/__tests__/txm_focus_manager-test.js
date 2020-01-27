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

    describe("focus manager optional onSelectAction callback", () => {
        const fm = new TXMFocusManager();

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

    test("focus manager onInputAction callback", () => {
        const fm = new TXMFocusManager();

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

    describe("focus manager navigation", () => {
        let focuses = [];
        for (let i = 0; i <= 10; i++) {
            let f = new Focusable();
            f.id = `focuses${i}`;
            focuses.push(f);
        }

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

        describe("simple left/right focus navigation", () => {
            const fm = new TXMFocusManager();

            test("No loss of focus moving down off row", () => {
                fm.setContentFocusables([focuses[1], focuses[2], focuses[3]]);
                fm.onInputAction(inputActions.moveDown);
                expect(fm.currentFocus).toBe(focuses[1]);
            });

            test("basic move right", () => {
                fm.onInputAction(inputActions.moveRight);
                expect(fm.currentFocus).toBe(focuses[2]);

                fm.onInputAction(inputActions.moveRight);
                expect(fm.currentFocus).toBe(focuses[3]);
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

            test("moving up from bottom chrome moves to last content focus", () => {
                fm.setContentFocusables([focuses[1], focuses[2], focuses[3]]);

                fm.navigateToNewFocus(inputActions.moveUp);
                expect(fm.currentFocus).toBe(focuses[3]);
            });

            test("moving up from chrome moves to last top chrome focus", () => {
                fm.navigateToNewFocus(inputActions.moveUp);
                expect(fm.currentFocus).toBe(topChrome[3]);
            });

            test("moving back down from top chrome moves to first content focus again", () => {
                fm.navigateToNewFocus(inputActions.moveDown);
                expect(fm.currentFocus).toBe(focuses[1]);
            });
        });
    });
});
