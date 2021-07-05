const path = require("path");
const got = require("got");
const moment = require("moment");

module.exports = (env) => {
    const environment = env === "prod" ? "" : "qa-";
    const hostname = `${environment}dimsum.truex.com`;
    const endpoint = path.join("cachebuster", "increment_cachebuster");
    const urlParams = "delay=10";

    return new Promise((resolve, reject) => {
        const isTravis = 'TRAVIS' in process.env && 'CI' in process.env;

        if (isTravis) {
            resolve();
        }

        (async () => {
            const { body } = await got.post(
                `http://${hostname}/${endpoint}?${urlParams}`,
                {
                    responseType: "json",
                }
            );

            console.log(
                `expected cachebuster value: ${body.current_cachebuster_value}`
            );
            console.log(
                `cachebuster is set to increment at: ${moment()
                .add(10, "minutes")
                .format("YYYY-MM-DD h:mm:ss a")}`
            );
            resolve(body.current_cachebuster_value);
        })();
    });
};