const path = require("path");
const fetch = require('node-fetch');

// Helper to ensure that served ads have an incremented "cache buster" counter value in their urls.
// This was put in place to work around unreliable cache purging previously encounted with Edgecast CDN.
// NOTE: this helper is no longer needed in practice, remains here for reference purposes.

module.exports = (env) => {
    const environment = env === "prod" ? "" : "qa-";
    const hostname = `${environment}dimsum.truex.com`;
    const endpoint = path.join("cachebuster", "increment_cachebuster");
    const urlParams = "delay=10";

    const isTravis = 'TRAVIS' in process.env && 'CI' in process.env;
    if (isTravis) {
        return Promise.resolve();
    }

    const url = `http://${hostname}/${endpoint}?${urlParams}`;
    return fetch(url, {method: 'POST'})
        .then(resp => {
            if (resp.ok) return resp.json();

            const statusText = resp.statusText || 'request failed';
            throw new Error(`increment_cachebuster failed: ${statusText}, url: ${url}`);
        })
        .then(body => {
            console.log(`expected cachebuster value: ${body.current_cachebuster_value}`);
            const nextIncrement = new Date();
            nextIncrement.setMinutes(nextIncrement.getMinutes() + 10);
            console.log(`cachebuster is set to increment at: ${nextIncrement.toLocaleString()}`);
            return body.current_cachebuster_value;
        });
};
