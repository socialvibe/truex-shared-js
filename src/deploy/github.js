const fs = require("fs");
const path = require("path");
const util = require("util");
const exec = require("child_process").exec;

module.exports = {
    /**
     * Clone a github repo into the a folder under the specified project name
     * @param {string} url - the github repo url
     * @param {string} cwd - the folder that will contain the project
     * @param {string} projectName - the name of the subfolder (the project)
     * @return {promise}
     */
    clone(url, cwd, projectName) {
        projectName = path.basename(projectName);
        return (
            util
            .promisify(fs.stat)(cwd)
            .catch((err) => {
                if (err.code === "ENOENT") {
                    // Ensure the project is cloned
                    fs.mkdirSync(cwd);
                    const command = `git clone ${url} ${projectName}`;
                    const params = {
                        cwd: cwd,
                    };
                    return util.promisify(exec)(command, params);
                } else {
                    // rethrow the error
                    throw err;
                }
            })
            // fetch latest build
            .then(() => {
                const command = `git fetch`;
                const params = {
                    cwd: path.join(cwd, projectName),
                };
                return util.promisify(exec)(command, params);
            })
        );
    },

    /**
     * Fetch
     * runs git fetch
     * @param {string} cwd
     * @returns {promise}
     */
    fetch(cwd) {
        return util.promisify(exec)("git fetch", { cwd });
    },

    /**
     * Reset
     * Hard reset onto a remote repo / branch
     * @param {string} cwd - project folder
     * @param {string} remote - remote repo name (eg: origin)
     * @param {string} branch - the branch to reset to
     * @returns {promise}
     */
    reset(cwd, remote, branch) {
        return util.promisify(exec)(`git reset ${remote}/${branch} --hard`, {
            cwd,
        });
    },

    /**
     * Checkout
     * Checkout a specific branch
     * @param {string} cwd - project folder
     * @param {string} branch
     * @returns {promise}
     */
    checkout(cwd, branch) {
        return util.promisify(exec)(`git checkout ${branch}`, {
            cwd,
        });
    },

    /**
     * Clean
     * Removes all untracked and uncommited changes
     * @param {string} cwd - project folder
     */
    clean(cwd) {
        return util.promisify(exec)(`git clean -fd`, {
            cwd,
        });
    },

    /**
     * getHash
     * @param {string} cwd - github project root
     * @param {string} branch - the branch to get the hash for
     * @returns {string} hash - the sha1 hash associated to the branch
     */
    getHash(cwd, branch) {
        const command = `git rev-parse ${branch}`;

        const params = {
            cwd: cwd,
        };

        if (process.env.TRAVIS_COMMIT) {
            return new Promise(function(resolve, reject){
                const retData = { stdout: `${process.env.TRAVIS_COMMIT}\n`, stderr: '' };

                resolve(retData);
            });
        } else {
            return util.promisify(exec)(command, params);
        }
    },

    /**
     * getBranch
     * @param {string} cwd - github project root
     * @returns {string} hash - the current checked out branch
     */
    getBranch(cwd) {
        const command = "git rev-parse --abbrev-ref HEAD";

        const params = {
            cwd: cwd,
        };

        if (process.env.TRAVIS_PULL_REQUEST) {
            const isPR = process.env.TRAVIS_PULL_REQUEST === "false" ? false : true;

            const branch = isPR ? process.env.TRAVIS_PULL_REQUEST_BRANCH : process.env.TRAVIS_BRANCH;

            const retData = { stdout: `${branch}\n`, stderr: '' };

            return new Promise(function(resolve, reject){
                resolve(retData);
            });
        } else {
            return util.promisify(exec)(command, params);
        }
    },
};
