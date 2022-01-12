import { inputActions } from './txm_input_actions';

/**
 * Describes the context of a focus change. Used to allow variations on focus processing
 * based on keyboard navigation vs mouse movement.
 *
 * E.g. one often wants auto-scrolling
 * into view of the new focus, but not when hovering over with the mouse.
 */
export class FocusChange {
    constructor(oldFocus, newFocus, inputAction, inputEvent) {
        this.oldFocus = oldFocus;
        this.newFocus = newFocus;
        this.action = inputAction;
        this.event = inputEvent;
    }
}

export default FocusChange;
