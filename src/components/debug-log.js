import { inputActions } from '../focus_manager/txm_input_actions';
import debugCss from './debug-log.scss';
import { TXMFocusManager } from "../focus_manager/txm_focus_manager";

/**
 * Defines a debug log display that overlays the existing application page, typically with the recent contents of the
 * console log.
 *
 * Use {captureConsoleLog()} to connect subsequent console log messages to this debug log display.
 * Use {show()} and {hide()} as needed to control the display of the logged lines.
 *
 * Be sure to include the sibling debug-log.scss style definitions into the main application's root .scss file.
 */
export class DebugLog {
    constructor() {
        let debugLog = [];

        let scrollPos = 0;

        let rootDiv;
        let msgsDiv;

        // Focus support:
        this.onInputAction = action => {
            if (action == inputActions.back) {
                this.hide();

            } else {
                let direction = action == inputActions.moveUp ? -1
                    : action == inputActions.moveDown ? 1
                        : 0;
                if (direction) {
                    scrollDebugLog(direction);
                }
            }

            return true; // handled
        };

        const focusManager = new TXMFocusManager();
        focusManager.id = 'debug-log'; // for more readable logging
        focusManager.onInputAction = this.onInputAction;

        function recordMsg(kind, msg) {
            if (kind && !msg) {
                // Tolerate just a single string arg.
                msg = kind;
                kind = 'log';
            }
            debugLog.push([kind, msg]);
            while (debugLog.length > 500) {
                debugLog.shift();
            }
        }

        this.recordMsg = recordMsg;

        this.isVisible = () => { return !!rootDiv }

        this.hide = () => {
            if (!rootDiv) return;

            focusManager.cleanup();

            rootDiv.parentNode.removeChild(rootDiv);
            rootDiv = null;
            msgsDiv = null;
        };

        this.show = (parentElement) => {
            this.hide();

            rootDiv = document.createElement('div');
            rootDiv.classList.add('debug-log');

            msgsDiv = document.createElement('div');
            msgsDiv.classList.add('msgs');
            rootDiv.appendChild(msgsDiv);

            if (!parentElement) parentElement = document.body;
            parentElement.appendChild(rootDiv);

            debugLog.forEach(msgItem => {
                const [kind, msg] = msgItem;
                displayLogMsg(kind, msg);
            });

            // Try to show the most recent messages, appropriately scrolled.
            scrollDebugLog(0, 0);

            focusManager.captureKeyboardFocus(rootDiv);
        };

        function displayLogMsg(kind, msg) {
            if (msgsDiv) {
                const newMsgDiv = document.createElement('pre');
                newMsgDiv.className = kind;
                newMsgDiv.innerText = msg;
                msgsDiv.appendChild(newMsgDiv);
            }
        }

        function scrollDebugLog(direction, oldPos) {
            if (!rootDiv || !msgsDiv) return;
            const pageH = rootDiv.clientHeight;
            const lineH = 20;
            const maxLines = Math.floor(pageH / lineH);
            const scrollStep = Math.floor(maxLines / 3) * lineH;

            const contentH = msgsDiv.clientHeight;

            const oldBottom = oldPos || scrollPos;
            let newBottom = oldBottom + scrollStep * direction;

            // Ensure we have margins away from the screen tops and bottoms.
            const maxBottom = 20;
            const minBottom = pageH - contentH - 20;

            if (contentH > pageH) {
                newBottom = Math.min(maxBottom, Math.max(minBottom, newBottom));
            } else {
                newBottom = minBottom;
            }
            msgsDiv.style.bottom = "" + newBottom + "px";
            scrollPos = newBottom;
        }

        this.captureConsoleLog = () => {
            this.restoreConsoleLog();

            const originalActions = {
                log: console.log.bind(console),
                info: console.info.bind(console),
                warn: console.warn.bind(console),
                error: console.error.bind(console)
            };
            this.originalConsoleActions = originalActions;

            function logAction(kind) {
                return function(...args) {
                    const msg = args.join(' ');
                    recordMsg(kind, msg);
                    originalActions[kind].apply(console, args);

                    if (rootDiv) {
                        // Ensure new msg is visible.
                        displayLogMsg(kind, msg);
                        scrollDebugLog(0, 0);
                    }
                };
            }

            console.log = logAction('log');
            console.info = logAction('info');
            console.warn = logAction('warn');
            console.error = logAction('error');
        };

        this.restoreConsoleLog = () => {
            const originalActions = this.originalConsoleActions;
            if (!originalActions) return;
            console.log = originalActions.log;
            console.info = originalActions.info;
            console.warn = originalActions.warn;
            console.error = originalActions.error;
            this.originalConsoleActions = undefined;
        };
    }
}

export default DebugLog;