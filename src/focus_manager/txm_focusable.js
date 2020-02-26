import { inputActions } from './txm_input_actions';

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
 */
export class Focusable {

    /**
     * Convenience constructor to allow for component view model JS instances to be associated with
     * @param elementRef an optional DOM element reference or query selector string used to refer to the associated DOM
     *   element associated with the component.
     * @param selectAction if present, overrides the onSelectAction implementation.
     * @param inputAction if present, overrides the onInputAction implementation.
     */
    constructor(elementRef, selectAction, inputAction) {
        this._elementRef = elementRef;
        if (selectAction) {
            this.onSelectAction = selectAction;
        }
        if (inputAction) {
            this.onInputAction = inputAction;
        }
    }

    /**
     * If the associated element present, adds mouseEnter and click event listeners to
     * set the focus (for mouseEnter event), or invoke the select action (for click event).
     * @param focusManager the focus manager to use for setting the current focus in the mouseEnter listener.
     */
    addMouseEventListeners(focusManager) {
        const elmt = this.element;
        if (elmt && elmt.addEventListener) {
            // Add mouse support if possible.
            if (focusManager) {
                elmt.addEventListener('mouseenter', () => {
                    focusManager.setFocus(this);
                });
            }

            elmt.addEventListener('click', event => {
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
     * @return {HTMLElement}
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
     * @param hasFocus has focus if true, false if otherwise.
     */
    onFocusSet(hasFocus) {
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
     * @param action name input action
     * @param event associated key event, can be missing for non-key events,
     *   e.g. voice (Alexa), test driver input injections, etc.
     *
     * @return true if the action was handled, otherwise false or undefined.
     */
    onInputAction(action, event) {}
}

export default Focusable;
