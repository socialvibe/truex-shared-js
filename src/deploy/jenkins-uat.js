const fetch = require('node-fetch');

module.exports = () => {
    const jenkinsUrl = "https://ctv-jenkins-02.truex.com/generic-webhook-trigger/invoke";
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
    }).catch(error => {
        console.log(error);
    });
};
