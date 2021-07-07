const path = require('path');

/**
 * getContentType
 * Given a filepath, getContentType returns the mime-type associated to the content
 *
 * @param {string} - filepath
 */
module.exports = (filePath) => {
    switch (path.extname(filePath).toLowerCase()) {
        case '.html':
            return 'text/html';
        case '.png':
            return 'image/png';
        case '.gif':
            return 'image/gif';
        case '.jpg':
        case '.jpeg':
            return 'image/jpeg';
        case '.svg':
            return 'image/svg+xml';
        case '.css':
            return 'text/css';
        case '.js':
            return 'text/javascript';
        default:
            return 'application/json';
    }
};
