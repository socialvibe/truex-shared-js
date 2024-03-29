const fs = require('fs');
const path = require('path');
const util = require('util');

/**
 * Returns a list of all the files in the directory, along with their contents.
 * @param {string} dir
 * @returns {array}
 */
function accumulateFiles(dir) {
    // helper to find all files to upload
    let allFiles = [];
    const entries = fs.readdirSync(dir);
    entries.forEach(f => {
        const filePath = path.join(dir, f);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            allFiles = allFiles.concat(accumulateFiles(filePath));
        } else {
            allFiles.push(filePath);
        }
    });
    return allFiles;
};

module.exports = accumulateFiles;
