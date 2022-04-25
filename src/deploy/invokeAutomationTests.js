const fetch = require('node-fetch');

function invokeAutomationTests({ jenkinsUrl, devicePlatforms, whakpapaBranchName, skylineBranchName, skylineS3BranchDirName, buildJobUrl, sourceRepo }) {
    const url = jenkinsUrl || "https://ctv-jenkins-02.truex.com/generic-webhook-trigger/invoke";

    return fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "token": "TAR-HTML5_UAT",
        },
        body: JSON.stringify({
            "whakapapaBranchName": whakpapaBranchName,
            "devicePlatforms": devicePlatforms || "Unknown,Tizen,LG,XboxOne,FireTV,AndroidTV,Vizio,Comcast",
            "skylineBranchName": skylineBranchName,
            "skylineS3BranchDirName": skylineS3BranchDirName,
            "fromBuildJobUrl": buildJobUrl,
            "sourceRepo": sourceRepo
        })
    }).catch(error => {
        console.error("Error invoking Jenkins UAT automation at" + url + '\n' + error);
    });
};

module.exports = invokeAutomationTests;
