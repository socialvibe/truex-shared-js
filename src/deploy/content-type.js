const path = require('path');

/**
 * getContentType
 * Given a filepath, getContentType returns the mime-type associated to the content
 *
 * @param {string} - filepath
 */
module.exports = (filePath) => {
    switch (path.extname(filePath).toLowerCase()) {
        // Images
        case '.png': return 'image/png';
        case '.gif': return 'image/gif';
        case '.jpg':
        case '.jpeg':
            return 'image/jpeg';
        case '.svg': return 'image/svg+xml';

        // Web content
        case '.html': return 'text/html';
        case '.css': return 'text/css';
        case '.js': return 'text/javascript';

        // Fonts
        case '.oft': return 'font/oft';
        case '.ttf': return 'font/ttf';
        case '.wof': return 'font/wof';
        case '.wof2': return 'font/wof2';

        // Video
        case '.avi': return 'video/avi';
        case '.m4s':
        case '.mp4':
            return 'video/mp4';
        case '.mpeg': return 'video/mpeg';
        case '.ogv': return 'video/ogg';
        case '.ts': return 'video/mpt2';
        case '.webm': return 'video/webm';
        case '.3gp': return 'video/3gp';
        case '.3gp2': return 'video/3gp2';

        // Adaptive bit rate video containers:
        case '.m3u8': return 'application/x-mpegURL';
        case '.mpd': return 'application/dash+xml';

        // Audio
        case '.acc': return 'audio/acc';
        case '.avi': return 'audio/avi';
        case '.mid':
        case '.midi':
            return 'audio/midi';
        case '.mp3': return 'audio/mpeg';
        case '.m4a': return 'audio/mp4';
        case '.oga': return 'audio/ogg';
        case '.opus': return 'audio/opus';
        case '.wav': return 'audio/wav';
        case '.webm': return 'audio/webm';

        // Assume JSON data
        default: return 'application/json';
    }
};
