const fs = require('fs');
const path = require('path');
const util = require('util');

/**
 *
 *
 * @param {string} dir
 * @param {array} [list=[]]
 * @returns {array}
 */
const accumulateFiles = (dir, list = []) => {
    // helper to find all files to upload
    return util
        .promisify(fs.readdir)(dir)
        .then((result) => {
            // separate files from directories
            const dirs = [];
            result.forEach((f) => {
                const fPath = path.join(dir, f);
                const stat = fs.statSync(fPath);
                if (stat.isDirectory()) {
                    dirs.push(fPath);
                } else {
                    list.push(fPath);
                }
            });

            // recursively search directories for files to accumulate
            if (dirs.length) {
                return Promise.all(
                    dirs.map((d) => {
                        return accumulateFiles(d, list);
                    }),
                );
            }

            return list;
        })
        .then((list) => {
            return list;
        });
};

module.exports = accumulateFiles;
