/**
 * @typedef {{
 *   element?: HTMLElement | null,
 *   onFocusSet?: (hasFocus: boolean, focusChange?: FocusChange) => void,
 *   onInputAction?: (action: string, event?: Event) => boolean | void,
 * }} FocusableLike
 */

/**
 * Describes the context of a focus change. Used to allow variations on focus processing
 * based on keyboard navigation vs mouse movement.
 *
 * E.g. one often wants auto-scrolling into view of the new focus, but not when hovering over with the mouse.
 */
export class FocusChange {
    /**
     * @param {FocusableLike | undefined} oldFocus
     * @param {FocusableLike | undefined} newFocus
     * @param {string} [inputAction]
     * @param {Event} [inputEvent]
     */
    constructor(oldFocus, newFocus, inputAction, inputEvent) {
        this.oldFocus = oldFocus;
        this.newFocus = newFocus;
        this.action = inputAction;
        this.event = inputEvent;
    }
}

export default FocusChange;
