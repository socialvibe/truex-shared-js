const path = require("path");
require('node-fetch');

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
        });
};
