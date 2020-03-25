/**
 * Gives a textual description of a DOM element, similar to the CSS selector.
 * Useful for testing to verify expected focus changes.
 */
function getElementPath(element) {
    if (!element) return ''; // no DOM element, no path

    const classList = element.classList;

    if (element == document.body) {
        // Special case
        return 'body';

    } else if (element.id) {
        // Use the id to describe
        return getQueryPath('#' + element.id);

    } else {
        let path = getTreePath();

        if (classList && classList.length > 0) {
            // Use the class names to make more readable, but still use the context of the parent path.
            // While some class names can be used for global identification, many others only indicate visual effects,
            // e.g. like .hasFocus.
            const classNames = [...element.classList];
            if (classNames.length > 0) {
                path = path + '.' + classNames.join('.');
            }
        }
        return path;
    }

    function getQueryPath(path) {
        return finalPath(document.querySelectorAll(path), path);
    }

    function getTreePath() {
        const path = element.localName || '';

        const parent = element.parentNode;
        if (parent) {
            const parentPath = getElementPath(parent);
            if (parentPath) {
                 const childNodes = path ? parent.querySelectorAll(path) : parent.children;
                return finalPath(childNodes, parentPath + ' ' + path);
            }
        }
        return path;
    }

    function finalPath(nodeList, path) {
        const nodesArray = [...nodeList];
        if (nodesArray.length > 1) {
            const index = nodesArray.indexOf(element);
            return path + '[' + index + ']';
        }
        return path;
    }
}

export { getElementPath };
export default getElementPath;
