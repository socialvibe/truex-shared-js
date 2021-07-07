/**
 * Promisify
 * Polyfill for util.promisify. Converts NodeJS Style callbacks into promises
 */
const util = require('util');
module.exports = {
    polyfill() {
        // turn node style callbacks into promises
        util.promisify = util.promisify ||
            function(fn) {
                return function(...nodeArgs) {
                    return new Promise((resolve, reject) => {
                        fn(...nodeArgs, (err, ...args) => {
                            if (err) {
                                reject(err);
                                return;
                            }
                            if (!args || args.length === 0) {
                                return resolve();
                            }
                            if (args.length === 1) {
                                return resolve(args[0]);
                            }
                            resolve(args);
                        });
                    });
                };
            };
    },
};
