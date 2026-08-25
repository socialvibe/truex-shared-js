import { inputActions } from './txm_input_actions.js';
import { FocusChange } from './txm_focus_change.js';

/**
 * @typedef {import('./txm_focus_manager.js').TXMFocusManager} TXMFocusManager
 * @typedef {import('./txm_focus_manager.js').FocusableLike} FocusableLike
 */

/**
 * Describes the method signatures that should be supported for a component to
 * participate with the notion of having/being the current focus.
 *
 * Having the current focus means the component:
 * a) is responsible for styling itself to indicate that visually,
 *    typically with an outline, color change, or size change.
 *
 * b) receives the key strokes from the remote control or keyboard as platform independent
 *    input action names, as enumerated by the TXM.inputActions object.
 *
 *    For every action in inputActions actually input, if there is a method of the form
 *    on{Action}Action, where {Action} is the capitalized version of the action string, that method
 *    will attempted to be invoked. E.g. onSelectAction().
 *
 *    If no such method is present, onInputAction(action, keyEvent) is invoked instead.
 * @implements {FocusableLike}
 */
export class Focusable {

    /**
     * Convenience constructor to allow for component view model JS instances to be associated with a DOM element.
     * If the element is a `<video>` and no select or input actions are supplied, `onVideoAction` is used.
     * @param {HTMLElement | string} [elementRef] DOM element or query selector for the component
     * @param {() => void} [selectAction] if present, overrides `onSelectAction`
     * @param {(action: string, event?: Event) => boolean | void} [inputAction] if present, overrides `onInputAction`
     * @param {TXMFocusManager} [focusManager] if present, registers mouse events for hover focus and click
     */
    constructor(elementRef, selectAction, inputAction, focusManager) {
        this._elementRef = elementRef;

        if (selectAction) {
            this.onSelectAction = selectAction;
        }
        if (inputAction) {
            this.onInputAction = inputAction;
        }
        if (focusManager) {
            this.addMouseEventListeners(focusManager);
        }
    }

    /**
     * If the associated element present, adds mouseEnter and click event listeners to
     * set the focus (for mouseEnter event), or invoke the select action (for click event).
     * @param {TXMFocusManager} focusManager
     * @param {() => boolean} [testMouseEnabled] return true if mouse events are allowed; ignored if false
     */
    addMouseEventListeners(focusManager, testMouseEnabled) {
        const elmt = this.element;
        if (elmt && elmt.addEventListener) {
            // Add mouse support if possible.
            if (focusManager) {
                // Mouse hovering over a focusable item should make it focused, but only if the mouse is
                // actually moved by the user (as opposed to the view scrolling underneath the mouse).
                elmt.addEventListener('mouseenter', event => {
                    if (testMouseEnabled && !testMouseEnabled()) return;
                    if (focusManager.lastMouseX == event.screenX && focusManager.lastMouseY == event.screenY) return;
                    focusManager.setFocus(this, event);
                    focusManager.lastMouseX = event.screenX;
                    focusManager.lastMouseY = event.screenY;
                });
            }

            elmt.addEventListener('click', event => {
                if (testMouseEnabled && !testMouseEnabled()) return;
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                if (this.onSelectAction) {
                    this.onSelectAction();
                } else if (this.onInputAction) {
                    this.onInputAction(inputActions.select, event);
                }
            });
        }
    }

    /**
     * The DOM element associated with this component. Can be undefined if the component implements components
     * with another approach, e.g. knockout or React.
     * @returns {HTMLElement | null | undefined}
     */
    get element() {
        let ref = this._elementRef;
        if (typeof ref == "string") return document.querySelector(ref);
        return ref;
    }

    /**
     * Invoked when the focus changes. It is the component's responsibility to restyle itself visually,
     * typically by setting a CSS class to effect the appearance as appropriate.
     *
     * Override as appropriate. The default implementation sets/removes the .hasFocus CSS class on the associated
     * DOM element.
     *
     * @param {boolean} hasFocus has focus if true, false otherwise
     * @param {FocusChange} [focusChange] detailed context of the focus change, such as
     *   old vs new focusables, the input action or event. This allows for mouse vs keyboard specific processing.
     *   E.g. auto-scrolling new focuses is usually desirable with keyboard navigation, but not with mouse hovering
     *   causing focus changes.
     */
    onFocusSet(hasFocus, focusChange) {
        let e = this.element;
        if (!e) return;
        if (hasFocus) {
            e.classList.add("hasFocus");
        } else {
            e.classList.remove("hasFocus");
        }
    }

    /**
     * If method present, invoked by focus manager to allow the focused component to field the input.
     * If not handled, the focus manager's default action handling is invoked instead, notably
     * for the moveUp/Down/Left/Right input actions.
     *
     * @param {string} action input action name
     * @param {Event} [event] associated key event; missing for non-key events,
     *   e.g. voice (Alexa), test driver input injections, etc.
     * @returns {boolean | void} true if the action was handled, otherwise false or undefined
     */
    onInputAction(action, event) {
        const element = this.element;
        if (element && element.localName == 'video') {
            // For videos, play/pause toggling is a good default action.
            return this.onVideoAction(action, event);
        }
    }

    /**
     * Specifies the default action handler for <video> elements.
     * The default implementation is to simply toggle play vs pause for the 'select' and 'playPause' input actions.
     *
     * @param {string} action
     * @param {Event} [event]
     * @returns {boolean | void}
     */
    onVideoAction(action, event) {
        const video = /** @type {HTMLMediaElement} */ (this.element);

        if (video && (action == inputActions.playPause || action == inputActions.select)) {
            // Toggle playback.
            if (video.paused) video.play();
            else video.pause();
            return true; // handled
        }
    }
}

export default Focusable;
