const fetch = require('node-fetch');

module.exports = (env) => {
    // const jenkinsUrl = "https://ctv-jenkins-02.truex.com/generic-webhook-trigger/invoke";
    const jenkinsUrl = "https://httpbin.org/post";
    console.log("starting fetch");

    console.log("process.env: ", process.env);
    // console.log("TRAVIS_BUILD_WEB_URL: ", process.env.TRAVIS_BUILD_WEB_URL);
    // console.log("TRAVIS_BUILD_NUMBER: ", process.env.TRAVIS_BUILD_NUMBER);

    return fetch(jenkinsUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "token": "TAR-HTML5_UAT",
        },
        body: JSON.stringify({
            "whakapapaBranchName": "develop",
            "devicePlatforms": "Unknown,Tizen,LG,XboxOne,FireTV,AndroidTV,Vizio,Comcast",
            "skylineBranchName": "develop",
            "skylineS3BranchDirName": "develop",
            "fromBuildJobUrl": process.env.TRAVIS_BUILD_WEB_URL,
            "sourceRepo": process.env.TRAVIS_REPO_SLUG
        })
    })
        .then(response => {
            console.log(response);
            console.log("status", response.status);
            return response.json();
        }).then(data => {
            console.log(data);
        })
        .catch(error => {
            console.log(error);
        });
};
