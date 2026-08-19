/**
 * Gives a textual description of a DOM element, similar to the CSS selector.
 * Useful for testing to verify expected focus changes.
 * @param {Element | null | undefined} element
 * @returns {string}
 */
function getElementPath(element) {
    if (!element) {
        return ''; // no DOM element, no path
    }

    const classList = element.classList;

    if (element === document.body) {
        // Special case
        return 'body';

    } else if (element.id) {
        // Use the id to describe
        return getQueryPath(element, '#' + element.id);

    } else {
        let path = getTreePath(element);
        if (classList && classList.length > 0) {
            // Use the class names to make the path more readable, but still use the context of the parent path.
            // While some class names can be used for global identification, many others only indicate visual effects,
            // e.g. like .hasFocus.
            const classNames = [...element.classList];
            path = path + '.' + classNames.join('.');
        }
        return path;
    }
}


/**
 * @param {Element} elm
 * @param {string} path
 * @returns {string}
 */
function getQueryPath(elm, path) {
    return finalPath(elm, document.querySelectorAll(path), path);
}

/**
 * @param {Element} elm
 * @returns
 */
function getTreePath(elm) {
    const path = elm.localName || '';
    const parent = /** @type {Element | null} */ (elm.parentNode);

    if (parent) {
        const parentPath = getElementPath(parent);

        if (parentPath) {
            const childNodes = path
                ? parent.querySelectorAll(path)
                : parent.children
            ;
            return finalPath(elm, childNodes, parentPath + ' ' + path);
        }
    }
    return path;
}

/**
 * @param {Element} elm
 * @param {NodeListOf<Element> | HTMLCollection} nodeList
 * @param {string} path
 * @returns {string}
 */
function finalPath(elm, nodeList, path) {
    const nodesArray = [...nodeList];
    if (nodesArray.length > 1) {
        const index = nodesArray.indexOf(elm);
        return path + '[' + index + ']';
    }
    return path;
}

export { getElementPath };
export default getElementPath;
