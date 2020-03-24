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

    } else if (classList && classList.length > 0) {
        // Use the class names to describe. Assume the first one is the main one, append the others style hints.
        var classNames = [...element.classList];
        var path = getQueryPath('.' + classNames[0]);
        if (classNames.length > 1) {
            path = path + '.' + classNames.slice(1).join('.');
        }
        return path;

    } else {
        // Use the tags and positions
        return getTreePath();
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
