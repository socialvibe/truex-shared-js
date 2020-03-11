import { inputActions }          from './txm_input_actions';
import { keyCodes, TXMPlatform } from './txm_platform';
import { Focusable }             from './txm_focusable';

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

        // make convenient for direct callbacks
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onInputAction = this.onInputAction.bind(this);
        this.onBackAction = this.onBackAction.bind(this);
        this.isHistoryAtBackAction = this.isHistoryAtBackAction.bind(this);
        this.pushBackActionState = this.pushBackActionState.bind(this);
    }

    get currentFocus() {
        return this._focus;
    }

    setFocus(newFocus) {
        let oldFocus = this.currentFocus;
        if (oldFocus === newFocus) return;
        if (oldFocus) {
            this._focus = undefined;
            if (oldFocus.onFocusSet) oldFocus.onFocusSet(false);
        }
        if (newFocus) {
            this._focus = newFocus;
            if (newFocus.onFocusSet) newFocus.onFocusSet(true);
        }
    }

    addKeyEventListener(toElement) {
        if (!toElement) toElement = document.body;
        toElement.addEventListener("keydown", this.onKeyDown);
    }

    cleanup() {
        window.removeEventListener("popstate", this.onBackAction);
        this.restoreBackActions();
    }

    /**
     * Call to prevent the back action on the remote from exiting the app.
     */
    blockBackActions() {
        this.pushBackActionState();
        window.addEventListener("popstate", this.onBackAction);
    }

    restoreBackActions() {
        window.removeEventListener("popstate", this.onBackAction);
        if (this.isHistoryAtBackAction()) {
            // Remove the block action guard.
            history.back();
        }
    }

    /**
     * Intercept browser back actions, interpret them as our own back action.
     * This is needed for platforms that do not expose the back action as a key event, i.e. FireTV.
     */
    pushBackActionState() {
        if (this.isHistoryAtBackAction()) return; // already in place
        history.pushState({backAction: true}, "backAction", window.location.href);
    }

    isHistoryAtBackAction() {
        return history.state && history.state.backAction;
    }

    onBackAction(event) {
        if (!this.isHistoryAtBackAction()) {
            console.log(`page back action proceeding: ${window.location.href}`);
            // setTimeout(this.pushBackActionState, 0); // ensure it is blocked going forward.
            //this.pushBackActionState(); // ensure it is blocked going forward.
            return false; // allow page change to proceed
        }

        // Block the back action processing by the browser.
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        console.log(`page back action blocked`);

        try {
            // field the back action explicitly to allow for app processing.
            this.onInputAction(inputActions.back);
        } catch (err) {
            let errMsg = this.platform.describeErrorWithStack(err);
            console.error(`TXMFocusManager: error with back action:\n${errMsg}`);
        }

        return true; // stop browser processing.
    }

    onKeyDown(event) {
        let handled = false;

        let keyCode = event.keyCode;
        let inputAction = this.platform.getInputAction(keyCode);
        if (keyCode === keyCodes.tab) {
            // Swallow TAB presses, they cause blue outlines to show on many browsers.
            handled = true;

        } else if (inputAction) {
            // Map the key event to in input action, process it.
            try {
                handled = this.onInputAction(inputAction, event);
            } catch (err) {
                handled = true;
                let errMsg = this.platform.describeErrorWithStack(err);
                console.error(`TXMFocusManager: error handling action ${inputAction} for key code ${keyCode}:\n${errMsg}`);
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

        let focus = this.currentFocus;
        if (!focus) {
            focus = this.getFirstFocus();
            this.setFocus(focus);
            return true;
        }
        if (!focus) return false;

        let capitalizedAction = action[0].toUpperCase() + action.slice(1);
        let actionMethodName = `on${capitalizedAction}Action`;

        if (focus[actionMethodName]) {
            let onActionMethod = focus[actionMethodName];
            if (typeof onActionMethod == "function") {
                // Focused component has an action-specific method.
                onActionMethod.apply(focus, [event]);
                return true;
            } else {
                console.warn(`TXMFocusManager: current focus ${actionMethodName} found, but not a function`);
            }
        }

        if (focus.onInputAction) {
            if (typeof focus.onInputAction == "function") {
                let handled = focus.onInputAction(action, event);
                if (handled) return true;
            } else {
                console.warn(`TXMFocusManager: current focus onInputAction found, but not a function`);
            }
        }

        if (inputActions.isMovementAction(action)) {
            this.navigateToNewFocus(action);
            return true;
        }

        return false; // not handled
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
            this.setFocus(this.getFirstFocus());
            return;
        }

        let newFocus;
        let pos = this.findFocusPosition(focus, this._topChromeFocusables);
        if (pos) {
            // Focus is in the top chrome.
            newFocus = this.getNewFocus(pos, action, this._topChromeFocusables);
            if (!newFocus && action == inputActions.moveDown) {
                newFocus = this.getFirstFocusIn(this._contentFocusables);
                if (!newFocus) newFocus = this.getFirstFocusIn(this._bottomChromeFocusables);
            }

        } else if (pos = this.findFocusPosition(focus, this._contentFocusables)) {
            // Focus is in the content area.
            newFocus = this.getNewFocus(pos, action, this._contentFocusables);
            if (!newFocus) {
                if (action == inputActions.moveUp) {
                    newFocus = this.getLastFocusIn(this._topChromeFocusables);
                } else if (action == inputActions.moveDown) {
                    newFocus = this.getFirstFocusIn(this._bottomChromeFocusables);
                }
            }

        } else if (pos = this.findFocusPosition(focus, this._bottomChromeFocusables)) {
            // Focus is in the bottom chrome.
            newFocus = this.getNewFocus(pos, action, this._bottomChromeFocusables);
            if (!newFocus) {
                if (action == inputActions.moveUp) {
                    newFocus = this.getLastFocusIn(this._contentFocusables);
                    if (!newFocus) newFocus = this.getLastFocusIn(this._topChromeFocusables)
                }
            }
        } else {
            // Current focus not found, fallback.
            newFocus = this.getFirstFocus();
        }

        if (newFocus) {
            this.setFocus(newFocus);
        }
    }

    /**
     * Used by the true[X] framework to specify the focusable control buttons along the top of the current page.
     * @param focusables array of focusable components, typically extending the {Focusable} class
     */
    setTopChromeFocusables(focusables) {
        this._topChromeFocusables = this.ensure2DArray(focusables);
    }

    /**
     * Used by the true[X] framework to specify the focusable control buttons along the bottom of the current page.
     * @param focusables array of focusable components, typically extending the {Focusable} class
     */
    setBottomChromeFocusables(focusables) {
        this._bottomChromeFocusables = this.ensure2DArray(focusables);
    }

    /**
     * Used by the page developer to specify the focusable control items in the main content area of the page.
     * It is the developer's responsibility to call this during their page loading initialization.
     *
     * @param focusables array of focusable components, typically extending the {Focusable} class
     * @param initialFocus specifies which focusable should be the initial current focus.
     *   If not specified, the first focusable is used.
     */
    setContentFocusables(focusables, initialFocus) {
        this._contentFocusables = this.ensure2DArray(focusables);
        if (!this.currentFocus) this.setFocus(initialFocus || this.getFirstFocus());
    }

    getFirstFocus() {
        let focus = this.getFirstFocusIn(this._contentFocusables);
        if (!focus) focus = this.getFirstFocusIn(this._topChromeFocusables);
        if (!focus) focus = this.getFirstFocusIn(this._bottomChromeFocusables);
        return focus;
    }

    getFirstFocusIn(focusables) {
        if (!Array.isArray(focusables)) return;
        for (let rowIndex in focusables) {
            let row = focusables[rowIndex];
            if (!row) continue;
            if (!Array.isArray(row)) return row; // Treat as an element.
            for (let colIndex in row) {
                let component = row[colIndex];
                if (!component) continue;
                if (Array.isArray(component)) continue; // shouldn't happen
                return component;
            }
        }
    }

    getLastFocus() {
        let focus = this.getLastFocusIn(this._contentFocusables);
        if (!focus) focus = this.getLastFocusIn(this._bottomChromeFocusables);
        if (!focus) focus = this.getLastFocusIn(this._topChromeFocusables);
        return focus;
    }

    getLastFocusIn(focusables) {
        if (!Array.isArray(focusables)) return;
        for (let rowIndex = focusables.length - 1; rowIndex >= 0; rowIndex--) {
            let row = focusables[rowIndex];
            if (!row) continue;
            if (!Array.isArray(row)) return row; // Treat as an element.
            for (let colIndex = row.length - 1; colIndex >= 0; colIndex--) {
                let component = row[colIndex];
                if (!component) continue;
                if (Array.isArray(component)) continue; // shouldn't happen
                return component;
            }
        }
    }

    findFocusPosition(focus, inFocusables) {
        for (let rowIndex in inFocusables) {
            let row = inFocusables[rowIndex];
            if (!row || !Array.isArray(row)) continue; // shouldn't happen in practice
            for (let colIndex in row) {
                let component = row[colIndex];
                if (!component) continue; // skip over holes
                if (component === focus) return {row: parseInt(rowIndex), col: parseInt(colIndex)};
            }
        }
    }

    getNewFocus(atPosition, forAction, inFocusables) {
        if (!atPosition) return;

        if (inputActions.isUpDownAction(forAction)) {
            let rowStep = forAction == inputActions.moveUp ? -1 : 1;

            // Skip over "holes" in the implied column
            for (let rowIndex = atPosition.row + rowStep;
                 0 <= rowIndex && rowIndex < inFocusables.length; rowIndex += rowStep) {
                let row = inFocusables[rowIndex];
                if (!row) continue;
                if (!Array.isArray(row)) continue; // shouldn't happen as per ensure2DArray
                let component = row[atPosition.col];
                if (!component) continue; // skip over empty holes
                return component;
            }

        } else if (inputActions.isLeftRightAction(forAction)) {
            let colStep = forAction == inputActions.moveLeft ? -1 : 1;

            // Skip over "holes" in the implied row.
            let row = inFocusables[atPosition.row];
            if (!row) return; // shouldn't happen as per findFocusPosition()
            for (let colIndex = atPosition.col + colStep; 0 <= colIndex && colIndex < row.length; colIndex += colStep) {
                let component = row[colIndex];
                if (!component) continue; // skip over empty holes
                return component;
            }
        }
    }

    ensure2DArray(array) {
        if (!array) return []; // i.e. empty, no focusables
        if (!Array.isArray(array)) return [[array]]; // treat as a single element matrix
        let hasSubArrays = array.find(e => Array.isArray(e));
        if (hasSubArrays) {
            // Already a 2D array.
            // - ensure single top-level elements become rows
            // - ensure shorter rows are extend their last element to the max row length.
            let maxRowLen = array.reduce((maxLen, e) => {
                return Math.max(maxLen, Array.isArray(e) ? e.length : 1)
            }, 0);
            let result = [];
            for (let rowIndex in array) {
                let row = array[rowIndex];
                if (!Array.isArray(row)) row = [row];
                else row = row.concat(); // avoid anti-aliasing
                if (row.length < maxRowLen) {
                    // Extend shorter rows out.
                    let lastElmnt = row[rowIndex.length - 1];
                    for (let i = row.length; i < maxRowLen; i++) {
                        row.push(lastElmnt);
                    }
                }
                result.push(row);
            }
            return result;

        } else {
            // Interpret as 2D matrix with a single row.
            return [array];
        }
    }
}
