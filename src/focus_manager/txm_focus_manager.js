import { inputActions } from './txm_input_actions';
import { keyCodes, TXMPlatform } from './txm_platform';
import { FocusChange } from './txm_focus_change';
import { getElementPath } from '../utils/get_element_path';

import '../utils/uuid-polyfill';
import { v4 as uuid } from 'uuid';
import timedTrace from "../utils/timed_trace";

/**
 * Defines a focus manager suitable for fielding remote control or keyboard events and directing them to an
 * abstract notion of the current focused component.
 */
export class TXMFocusManager {

    constructor(platformOverride) {
        this.platform = platformOverride || new TXMPlatform();

        this._focus = undefined;

        this._topChromeFocusables = [];
        this._contentFocusables = [];
        this._bottomChromeFocusables = [];

        this._lastTopFocus = undefined;
        this._lastContentFocus = undefined;
        this._lastBottomFocus = undefined;

        this._isBlockingBackActions = false;
        this._onBackAction = undefined;
        this._handlesAllInputs = false; // input handling bubbles up default
        this._oldActiveElement = undefined;

        // Set to 0 to disable throttling.
        this.keyThrottleDelay = 100; // milliseconds
        this._lastKeyCode = undefined;
        this._lastKeyEventTimestamp = 0;

        // Used to filter out spurious mouseenter events.
        this.lastMouseX = undefined;
        this.lastMouseY = undefined;

        // make convenient for direct callbacks
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onInputAction = this.onInputAction.bind(this);
        this.onPopState = this.onPopState.bind(this);

        this.id = uuid(); // ensure a unique id for proper guards in back action blocking
        this.debug = false; // in case we need to debug focus manager processing
    }

    debugLog(msg) {
        if (this.debug) {
            timedTrace(`${this.id} focusManager: ${msg}`);
        }
    }

    get currentFocus() {
        return this._focus;
    }

    /**
     * Sets the current focus, invoking onFocusSet(false) on the old focus, onFocusSet(true) on the new focus.
     * @param newFocus the new focusable item
     * @param fromInputActionOrEvent optional, indicates the focus is set from an input action string or mouse event.
     */
    setFocus(newFocus, fromInputActionOrEvent) {
        let oldFocus = this.currentFocus;
        if (oldFocus === newFocus) return;
        this._focus = newFocus || undefined;

        const inputAction = typeof fromInputActionOrEvent == 'string' ? fromInputActionOrEvent : undefined;
        const inputEvent = fromInputActionOrEvent instanceof Event ? fromInputActionOrEvent : undefined;
        const focusChange = new FocusChange(oldFocus, newFocus, inputAction, inputAction);

        if (oldFocus && oldFocus.onFocusSet) oldFocus.onFocusSet(false, focusChange);

        if (newFocus) {
            this._saveLastFocus(newFocus, newFocus);
            if (newFocus.onFocusSet) newFocus.onFocusSet(true, focusChange);
        } else {
            // We are clearing the focus completely.
            this._saveLastFocus(undefined, oldFocus);
        }
    }

    _saveLastFocus(focusValue, forFocus) {
        if (this.isInTopChrome(forFocus)) {
            this._lastTopFocus = focusValue;
        } else if (this.isInContent(forFocus)) {
            this._lastContentFocus = focusValue;
        } else if (this.isInBottomChrome(forFocus)) {
            this._lastBottomFocus = focusValue;
        }
    }

    /**
     * Gives a textual description of the current focus, similar to the CSS selector.
     * Useful for test scripts to verify expected focus changes.
     */
    getCurrentFocusPath() {
        const focus = this.currentFocus;
        if (!focus) return; // no focus, no path
        return getElementPath(focus.element);
    }

    addKeyEventListener(toElement) {
        this.removeKeyEventListener();
        if (!toElement) toElement = document.body;
        this.keyFocusElement = toElement;
        toElement.addEventListener("keydown", this.onKeyDown);
    }

    removeKeyEventListener() {
        if (this.keyFocusElement) {
            this.keyFocusElement.removeEventListener("keydown", this.onKeyDown);
            this.keyFocusElement = null;
        }
    }

    /**
     * Ensures all key events are sent to the specific DOM element, with all input actions processed
     * from those events, including the capture of history back actions. All events are assumed to be handled.
     *
     * Intended to be used for popup components that need to temporarily capture all keyboard inputs.
     *
     * {cleanup} should be called when complete to restore the keyboard focus to the original active element.
     *
     * @param {HTMLElement} withElement the element to set the keyboard focus to.
     * @param {Function} onBackAction optional callback to invoke when the user hits the back action key
     *  or history back is otherwise invoked.
     */
    captureKeyboardFocus(withElement, onBackAction) {
        if (!withElement) throw new Error("captureKeyboardFocus: missing element arg");
        this.blockBackActions(true);
        this.addKeyEventListener(withElement);
        this._onBackAction = onBackAction;
        this._handlesAllInputs = true;
        this._oldActiveElement = document.activeElement;

        const tabIndex = withElement.getAttribute('tabindex');
        if (!tabIndex) {
            // Ensure the DOM element can receive the keyboard focus.
            withElement.setAttribute('tabindex', "-1");
        }
        withElement.focus();
    }

    cleanup() {
        this.removeKeyEventListener();
        this.restoreBackActions();

        // Release memory references
        this._lastTopFocus = this._lastContentFocus = this._lastBottomFocus = undefined;
        this._topChromeFocusables = [];
        this._contentFocusables = [];
        this._bottomChromeFocusables = [];
        this._onBackAction = undefined;

        if (this._oldActiveElement) {
            this._oldActiveElement.focus();
            this._oldActiveElement = undefined;
        }
    }

    /**
     * Call to prevent the back action on the remote from exiting the app.
     *
     * Note: some platforms like the FireTV do not allow the back action key event to be fielded at all,
     * forcing history management approaches via the window's "popstate" event.
     *
     * @param mapHistoryBackToInputAction if true, every explicit or implicit history.back() also injects
     *   an inputActions.back action into this focus manager's onInputAction method, allowing for a consistent
     *   and portable approach to managing back actions.
     */
    blockBackActions(mapHistoryBackToInputAction) {
        this.mapHistoryBackToInputAction = mapHistoryBackToInputAction;
        this._isBlockingBackActions = true;
        this.pushBackActionBlock();
        window.addEventListener("popstate", this.onPopState);
    }

    restoreBackActions() {
        if (!this._isBlockingBackActions) return;
        this._isBlockingBackActions = false;

        var state = history.state;
        window.removeEventListener("popstate", this.onPopState);

        setTimeout(() => {
            // Ensure no back action blocks are present from this focus manager.
            if (state && state.forTruex && state.focusManager == this.id && state.backActionStub) {
                history.go(-2); // remove stub and block
                this.debugLog('restoreBackActions: remove stub and block');

            } else if (state && state.forTruex && state.focusManager == this.id && state.backActionBlock) {
                history.back(); // remove block
                this.debugLog('restoreBackActions: remove block');

            } else {
                this.debugLog('restoreBackActions: nothing removed');
            }
        }, 0);
    }

    /**
     * Intercept browser back actions, interpret them as our own back action.
     * This is needed for platforms that do not expose the back action as a key event, i.e. FireTV.
     */
    pushBackActionBlock() {
        history.pushState({backActionBlock: true, forTruex: true, focusManager: this.id}, "", null);
        this.debugLog('pushBackActionBlock: pushed');

        // Push the back action stub that allows a back action to be consumed.
        this.pushBackActionStub();
    }

    pushBackActionStub() {
        if (!this._isBlockingBackActions) return; // blocking is no longer in effect

        history.pushState({backActionStub: true, forTruex: true, focusManager: this.id}, "", null);
        this.debugLog('pushBackActionStub: pushed');
    }

    onPopState(event) {
        // We only need to do anything if the user navigated back from the back action stub.
        const state = history.state;
        const isAtBackActionBlock = state && state.forTruex && state.focusManager == this.id && state.backActionBlock;
        if (!isAtBackActionBlock) {
            if (this.debug) {
                this.debugLog('onPopState: pop ignored, now at: ' + JSON.stringify(state));
            }
            return;
        }

        this.debugLog('onPopState: now at back action block');

        // Note: back action events can't have their processing stopped.
        //event.preventDefault();

        if (this.mapHistoryBackToInputAction) {
                // Inject back input action explicitly to allow for app processing,
                // but outside of the popstate event thread.
                setTimeout(() => {
                    try {
                        this.debugLog('onPopState: injecting back action');
                        this.onInputAction(inputActions.back);
                    } catch (err) {
                        let errMsg = this.platform.describeErrorWithStack(err);
                        console.error(`${this.id} focusManager.onPopState: error injecting back action:\n${errMsg}`);
                    }
                }, 0);
        }

        this.pushBackActionStub(); // ensure the back action is blocked again
    }

    onKeyDown(event) {
        let keyCode = event.keyCode;

        const throttleDelay = this.keyThrottleDelay;
        if (throttleDelay > 0) {
            // We are throttling key presses that happen too fast, e.g. when holding down a key on the remote.
            // Otherwise too much processing and tracking happens.
            const now = Date.now();
            const elapsedTime = now - this._lastKeyEventTimestamp;
            if (keyCode == this._lastKeyCode && elapsedTime <= throttleDelay) {
                // Swallow the excess key event.
                return true; // handled
            }
            this._lastKeyCode = keyCode;
            this._lastKeyEventTimestamp = now;
        }

        let handled = false;
        let inputAction = this.platform.getInputAction(keyCode);

        if (this.debug) {
            const focusPath = this.getCurrentFocusPath();
            const targetPath = getElementPath(event.target);
            this.debugLog(`onKeyDown: action: ${inputAction} key: ${keyCode} focus: ${focusPath} target: ${targetPath}`);
        }

        if (keyCode === keyCodes.tab) {
            // Swallow TAB presses, they cause blue outlines to show on many browsers.
            handled = true;

        } else if (inputAction == inputActions.back && this.platform.useHistoryBackActions) {
            // Back action key events cannot be reliably overridden on the current platform.
            // We use history.back/popstate processing instead.
            return true; // let the browser continue its processing.

        } else if (inputAction) {
            // Map the key event to in input action, process it.
            try {
                handled = this.onInputAction(inputAction, event);
            } catch (err) {
                handled = true;
                let errMsg = this.platform.describeErrorWithStack(err);
                console.error(`${this.id} focusManager.onKeyDown: error handling action ${inputAction} for key code ${keyCode}:\n${errMsg}`);
            }
        }

        if (!handled && !this.platform.isUnknown) {
            // Swallow all keystrokes by default on TV/console platforms
            // (for the desktop during development, we like refresh and debug keystrokes to still work)
            handled = true;
        }

        if (handled) {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            return false; // prevent processing by browser
        }
        return true; // continue processing by browser
    }

    /**
     * Directs the input action to the current focused component, invoking the appropriate action handler.
     *
     * In particular, if there is a method of the form on{Action}Action, where {Action} is the
     * capitalized version of the action string, that method will attempted to be invoked.
     * E.g. onSelectAction().
     *
     * If no such method is present, the focused component's onInputAction(action, keyEvent) is invoked
     * instead if present.
     *
     * If the focused component does not handle the action at all, and the action is a movement action, the
     * focus manager attempts to find the new focus via the navigateToNewFocus() method.
     *
     * @return {Boolean} true if the action was handled, false otherwise.
     */
    onInputAction(action, event) {
        if (!action) return false;

        // Map common console controller actions.
        if (this.platform.isPS4) {
            switch (action) {
                case inputActions.buttonTriangle: action = inputActions.menu; break;
                case inputActions.buttonX: action = inputActions.select; break;
                case inputActions.buttonCircle: action = inputActions.back; break;
            }
        } else if (this.platform.isXboxOne) {
            switch (action) {
                case inputActions.buttonY: action = inputActions.menu; break;
                case inputActions.buttonA: action = inputActions.select; break;
                case inputActions.buttonB: action = inputActions.back; break;
            }
        } else if (this.platform.isNintendoSwitch) {
            switch (action) {
                case inputActions.buttonA: action = inputActions.select; break;
                case inputActions.buttonB: action = inputActions.back; break;
            }
        }

        if (action == inputActions.back && this._onBackAction) {
            this._onBackAction();
            return true;
        }

        let focus = this.currentFocus;
        // if no element is currently focused, and the user is attempting to navigate or select, set default focus
        if (!focus && (inputActions.isMovementAction(action) || action == inputActions.select)) {
            focus = this.getDefaultFocus();
            this.setFocus(focus, action);
            return true;
        }
        if (!focus) return this._handlesAllInputs;

        let capitalizedAction = action[0].toUpperCase() + action.slice(1);
        let actionMethodName = `on${capitalizedAction}Action`;

        if (focus[actionMethodName]) {
            let onActionMethod = focus[actionMethodName];
            if (typeof onActionMethod == "function") {
                // Focused component has an action-specific method.
                onActionMethod.apply(focus, [event]);
                return true;
            } else {
                console.warn(`${this.id} focusManager: current focus ${actionMethodName} found, but not a function`);
            }
        }

        if (focus.onInputAction) {
            if (typeof focus.onInputAction == "function") {
                let handled = focus.onInputAction(action, event);
                if (handled) return true;
            } else {
                console.warn(`${this.id} focusManager: current focus onInputAction found, but not a function`);
            }
        }

        if (inputActions.isMovementAction(action)) {
            this.navigateToNewFocus(action);
            return true;
        }

        return this._handlesAllInputs;
    }

    /**
     * Moves from the current focused component to the next one in its 2D grid of focusables, as per the movement
     * action's direction.
     *
     * Moving up from content focusables moves into the top chrome focusables, if they exist.
     * Moving down from content focusables moves into the bottom chrome focusables, if they exist.
     *
     * Moving down from the top chrome focusables moves into the content focusables, if they exist,
     * otherwise moving into the bottom chrome focusables.
     *
     * Similarly, moving up from the bottom chrome focusables move into the content focusables, if they exist,
     * otherwise moving into the top chrome focusables.
     *
     * @param action one of inputActions.moveLeft, .moveRight, moveUp, .moveDown
     */
    navigateToNewFocus(action) {
        if (!inputActions.isMovementAction(action)) return;

        let focus = this.currentFocus;
        if (!focus) {
            // No focus yet, establish it.
            this.setFocus(this.getDefaultFocus(), action);
            return;
        }

        let newFocus;
        if (this.isInTopChrome(focus)) {
            // Focus is in the top chrome.
            newFocus = this.findNextFocus(focus, action, this._topChromeFocusables);
            if (!newFocus && action == inputActions.moveDown) {
                newFocus = this._lastContentFocus || this.getFirstFocusIn(this._contentFocusables);
                if (!newFocus) {
                    newFocus = this._lastBottomFocus || this.getFirstFocusIn(this._bottomChromeFocusables);
                }
            }

        } else if (this.isInContent(focus)) {
            // Focus is in the content area.
            newFocus = this.findNextFocus(focus, action, this._contentFocusables);
            if (!newFocus) {
                if (action == inputActions.moveUp) {
                    newFocus = this._lastTopFocus || this.getFirstFocusIn(this._topChromeFocusables);
                } else if (action == inputActions.moveDown) {
                    newFocus = this._lastBottomFocus || this.getFirstFocusIn(this._bottomChromeFocusables);
                }
            }

        } else if (this.isInBottomChrome(focus)) {
            // Focus is in the bottom chrome.
            newFocus = this.findNextFocus(focus, action, this._bottomChromeFocusables);
            if (!newFocus) {
                if (action == inputActions.moveUp) {
                    newFocus = this._lastContentFocus || this.getFirstFocusIn(this._contentFocusables);
                    if (!newFocus) {
                        newFocus = this._lastTopFocus || this.getLastFocusIn(this._topChromeFocusables)
                    }
                }
            }
        } else {
            // Current focus not found, fallback.
            newFocus = this.getDefaultFocus();
        }

        if (newFocus) {
            this.setFocus(newFocus, action);
        }
    }

    /**
     * Processes a set of input actions and delay values, i.e. strings are passed to {#onInputAction}
     * as an input action, numbers are passed to {#wait} for the specified delay.
     *
     * This is to support the simulation of user inputs via test scripts.
     *
     * @param actionsAndDelays set of items to process.
     *
     * @return {Promise} a promise that completes when all of the inputs have been injected, all waits completed.
     *   The current focus path is used as the promise result, via {#getCurrentFocusPath}.
     */
    async inject(...actionsAndDelays) {
        if (actionsAndDelays.length > 0 && Array.isArray(actionsAndDelays[0])) {
            // Allow passing in explicit arrays of items.
            actionsAndDelays = actionsAndDelays[0];
        }

        let injectItem = actionOrDelay => {
            if (typeof actionOrDelay === 'number') {
                // Return on the delay promise.
                return this.wait(actionOrDelay);
            } else if (typeof actionOrDelay === 'string' || actionOrDelay instanceof String) {
                // Inject the input action, nothing explicit to return.
                this.onInputAction(actionOrDelay);
            }
        };

        // An injection is the action input plus a delay.
        for(let doItem of actionsAndDelays.map(action => () => injectItem(action))) {
            await doItem();
        }

        return this.getCurrentFocusPath();
    }

    /**
     * Convenience promise-based delay helper for test scripts.
     *
     * @param {Number} # of milliseconds to delay, where < 0 Means no delay.
     */
    wait(delay) {
        return new Promise(resolve => {
            if (delay >= 0) {
                setTimeout(() => { resolve() }, delay);
            } else {
                resolve();
            }
        });
    }


    /**
     * Used by the true[X] framework to specify the focusable control buttons along the top of the current page.
     * @param focusables array of focusable components, typically extending the {Focusable} class
     * @param defaultTopFocus optional, if present, it indicates which top chrome focusable to move to when
     *   moving up from the content area.
     */
    setTopChromeFocusables(focusables, defaultTopFocus) {
        this._topChromeFocusables = this.sortVisually(this.flattenArray(focusables));
        this._lastTopFocus =  this.isInTopChrome(defaultTopFocus) ? defaultTopFocus : undefined;
    }

    /**
     * Used by the true[X] framework to specify the focusable control buttons along the bottom of the current page.
     * @param focusables array of focusable components, typically extending the {Focusable} class
     * @param defaultBottomFocus optional, if present, it indicates which bottom chrome focusable to move to when
     *   moving down from the content area.
     */
    setBottomChromeFocusables(focusables, defaultBottomFocus) {
        this._bottomChromeFocusables = this.sortVisually(this.flattenArray(focusables));
        this._lastBottomFocus = this.isInBottomChrome(defaultBottomFocus) ? defaultBottomFocus : undefined;
    }

    /**
     * Used by the page developer to specify the focusable control items in the main content area of the page.
     * It is the developer's responsibility to call this during their page loading initialization.
     *
     * @param focusables array of focusable components, typically extending the {Focusable} class
     * @param defaultFocus specifies which focusable should be the initial current focus.
     *   If not specified, the first focusable is used.
     */
    setContentFocusables(focusables, defaultFocus) {
        // Reset the current focus unless it is in the top or bottom chrome.
        const current = this.currentFocus;
        const isInTopChrome = this.isInTopChrome(current);
        const isInBottomChrome = this.isInBottomChrome(current);
        const resetFocus = !current || !isInTopChrome && !isInBottomChrome;

        this._contentFocusables = this.sortVisually(this.flattenArray(focusables));

        // Mark the default content focus, but only if it is actually a valid content focusable.
        this._lastContentFocus = this.isInContent(defaultFocus) ? defaultFocus : undefined;

        if (resetFocus) {
            if (!defaultFocus) {
                // Fallback to the first possible content focus.
                // (We do not default to a top/bottom chrome focus.)
                defaultFocus = this.getFirstFocusIn(this._contentFocusables);
            }
            this.setFocus(defaultFocus);
        }
    }

    getDefaultFocus() {
        let focus = this._lastContentFocus || this.getFirstFocusIn(this._contentFocusables);
        if (!focus) focus = this._lastTopFocus || this.getFirstFocusIn(this._topChromeFocusables);
        if (!focus) focus = this._lastBottomFocus || this.getFirstFocusIn(this._bottomChromeFocusables);
        return focus;
    }

    getFirstFocusIn(focusables) {
        if (Array.isArray(focusables)) {
            for (let index in focusables) {
                const f = focusables[index];
                if (f) return f;
            }
        }
        return undefined;
    }

    getLastFocus() {
        let focus = this.getLastFocusIn(this._contentFocusables);
        if (!focus) focus = this.getLastFocusIn(this._bottomChromeFocusables);
        if (!focus) focus = this.getLastFocusIn(this._topChromeFocusables);
        return focus;
    }

    getLastFocusIn(focusables) {
        if (Array.isArray(focusables)) {
            for (let index = focusables.length - 1; index >= 0; index--) {
                const f = focusables[index];
                if (f) return f;
            }
        }
        return undefined;
    }

    isInTopChrome(focusable) {
        return this._topChromeFocusables.indexOf(focusable) >= 0;
    }

    isInContent(focusable) {
        return this._contentFocusables.indexOf(focusable) >= 0;
    }

    isInBottomChrome(focusable) {
        return this._bottomChromeFocusables.indexOf(focusable) >= 0;
    }

    findNextFocus(fromFocus, forAction, inFocusables) {
        if (!fromFocus) return;

        const focusBounds = getBoundsOf(fromFocus);

        var getLaneRange;
        var getNearEdgeDistance;
        var getFarEdgeDistance;
        switch (forAction) {
            case inputActions.moveRight:
                getLaneRange = bounds => { return {start: bounds.top, end: bounds.bottom} };
                getNearEdgeDistance = newBounds => newBounds.left - focusBounds.right;
                getFarEdgeDistance = newBounds => newBounds.right - focusBounds.right;
                break;
            case inputActions.moveLeft:
                getLaneRange = bounds => { return {start: bounds.top, end: bounds.bottom} };
                getNearEdgeDistance = newBounds => focusBounds.left - newBounds.right;
                getFarEdgeDistance = newBounds => focusBounds.left - newBounds.left;
                break;
            case inputActions.moveDown:
                getLaneRange = bounds => { return {start: bounds.left, end: bounds.right} };
                getNearEdgeDistance = newBounds => newBounds.top - focusBounds.bottom;
                getFarEdgeDistance = newBounds => newBounds.bottom - focusBounds.bottom;
                break;
            case inputActions.moveUp:
                getLaneRange = bounds => { return {start: bounds.left, end: bounds.right} };
                getNearEdgeDistance = newBounds => focusBounds.top - newBounds.bottom;
                getFarEdgeDistance = newBounds => focusBounds.top - newBounds.top;
                break;
            default:
                // Not a movement action.
                return;
        }

        const focusLane = getLaneRange(focusBounds);

        // First try to find the best match in the same visual row or column long the direction of movement,
        // i.e. anything overlapping the same focus lane.
        var result = findNextClosestFocus(newRange => {
            const overlapRange = {
                start: Math.max(newRange.start, focusLane.start),
                end: Math.min(newRange.end, focusLane.end)
            };

            const newOverlap = overlapRange.end - overlapRange.start;
            if (newOverlap <= 0) return; // only consider items actually overlapping the focus lane

            const newDistance = newRange.start - focusLane.start; // i.e. distance to left/top edge of focus lane
            return newDistance;
        });

        if (!result) {
            // Finally look for the remaining outside items closest to the focus lane.
            result = findNextClosestFocus(newRange => {
                const newDistance = (newRange.end <= focusLane.end)
                    ? focusLane.end - newRange.end // i.e. to the left/top of the focus lane
                    :  newRange.start - focusLane.start; // to the right/bottom of the focus lane
                return newDistance;
            });
        }
        return result;

        function findNextClosestFocus(getFocusMatchDistance) {
            var currResult;
            var currDistanceBeyondFocus;
            var currMatchDistance;
            inFocusables.forEach(newFocus => {
                if (!newFocus || newFocus === fromFocus) return;

                const newBounds = getBoundsOf(newFocus);
                if (newBounds.width <= 0 || newBounds.height <= 0) return; // ignore zero-sized items

                // only look at focusables that are actually visually beyond the current focus edge
                var newBeyondDistance;
                const focusIntersection = getIntersection(newBounds, focusBounds);
                if (focusIntersection && !equalBounds(focusIntersection, newBounds)) {
                    // However, if two focusables actually visually intersect but not completely cover the other,
                    // we assume the developer knows this and that things look visually ok. E.g. this happens
                    // with production choice cards, where the Yes/No buttons technically have overlapping
                    // images, although the core visible content does not overlap.
                    //
                    // In this case, we measure from the opposite edge of the new focus item.
                    newBeyondDistance = getFarEdgeDistance(newBounds);
                    if (newBeyondDistance <= 0) {
                        // new focus' far edge must be beyond the current focus's far edge
                        return;
                    }

                } else {
                    newBeyondDistance = getNearEdgeDistance(newBounds);
                    if (newBeyondDistance < 0) {
                        return; // new focus' near edge must be adjacent or beyond the current focus's far edge
                    }
                }

                const newRange = getLaneRange(newBounds);
                const newMatchDistance = getFocusMatchDistance(newRange);
                if (newMatchDistance === undefined) return; // ignoring item

                if (currResult === undefined // first match
                    || newBeyondDistance < currDistanceBeyondFocus // closer to focus along lane
                    || newBeyondDistance == currDistanceBeyondFocus && newMatchDistance < currMatchDistance) { // a better match
                    currResult = newFocus;
                    currDistanceBeyondFocus = newBeyondDistance;
                    currMatchDistance = newMatchDistance;
                }
            });
            return currResult;
        }

        function getBoundsOf(focusable) {
            return focusable && focusable.element && focusable.element.getBoundingClientRect()
              || {top: 0, left: 0, bottom: 0, right: 0, width: 0, height: 0};
        }

        function getIntersection(bounds1, bounds2) {
            const intersection = {
              top: Math.max(bounds1.top, bounds2.top),
              left: Math.max(bounds1.left, bounds2.left),
              bottom: Math.min(bounds1.bottom, bounds2.bottom),
              right: Math.min(bounds1.right, bounds2.right)
            };
            const w = intersection.right - intersection.left;
            const h = intersection.bottom - intersection.top;
            return w > 0 && h > 0 && intersection;
        }

        function equalBounds(bounds1, bounds2) {
            return bounds1.top == bounds2.top
                && bounds1.left == bounds2.left
                && bounds1.bottom == bounds2.bottom
                && bounds1.right == bounds2.right;
        }
    }

    sortVisually(focusables) {
        focusables.sort((f1, f2) => {
            const bounds1 = f1.element && f1.element.getBoundingClientRect();
            const bounds2 = f2.element && f2.element.getBoundingClientRect();

            // Can encounter null bounds during testing with stubbed focusables.
            if (!bounds1 && !bounds2) {
                return 0;
            } else if (!bounds1) {
                return -1;
            } else if (!bounds2) {
                return 1;
            }

            var cmp = bounds1.top - bounds2.top;
            if (cmp == 0) {
                cmp = bounds1.left - bounds2.left;
            }
            return cmp;
        });
        return focusables;
    }

    flattenArray(array) {
        const result = [];
        traverse(array);
        return result;

        function traverse(value) {
            if (!value) return;
            if (Array.isArray(value)) {
                value.forEach(traverse);
            } else {
                result.push(value); // found an element
            }
        }
    }
}
