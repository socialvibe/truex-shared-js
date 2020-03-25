/**
 * Gives a textual description of a DOM element, similar to the CSS selector.
 * Useful for testing to verify expected focus changes.
 */
function getElementPath(element) {
    if (!element) return ''; // no DOM element, no path

    var classList = element.classList;

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
            var classNames = [...element.classList];
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
        var path = element.localName;
        if (!path) path = '';

        var parent = element.parentNode
        if (parent) {
            var parentPath = getElementPath(parent);
            if (parentPath) {
                return finalPath(parent.children, parentPath + ' ' + path);
            }
        }
        return path;
    }

    function finalPath(nodeList, path) {
        var nodesArray = [...nodeList];
        if (nodesArray.length > 1) {
            var index = nodesArray.indexOf(element);
            return path + '[' + index + ']';
        }
        return path;
    }
}

export { getElementPath };
export default getElementPath;
