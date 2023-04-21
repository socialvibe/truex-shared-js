// public modules
const util = require("util");
const fs = require("fs");
const path = require("path");

const s3 = require("./s3-upload");
const accumulateFiles = require("./accumulate-files");
const { getContentType } = require("./content-type");

// helper function to flatten array
const flattenDeep = (arr) => {
    return arr.reduce(
        (acc, val) =>
            Array.isArray(val) ? acc.concat(flattenDeep(val)) : acc.concat(val),
        []
    );
};

module.exports = (bucket, keyPrefix, sourcePath = "./dist", config = {}, postProcessFile) => {
    const distDir = path.resolve(sourcePath);

    console.log("uploading " + sourcePath);

    // Upload each file asynchronously for the best throughput.
    const allFiles = accumulateFiles(distDir);
    return Promise.all(allFiles.map(filePath => {
        const key = path.join(keyPrefix, path.relative(path.resolve(distDir), filePath));
        const contentType = getContentType(filePath);
        const uploadedUrl = bucket + '/' + key;
        console.log(`uploading file: ${uploadedUrl} ...`);
        let uploadPromise = util.promisify(fs.readFile)(filePath).then(fileData => {
            return s3.uploadFile(
                bucket,
                key,
                fileData,
                contentType,
                "public-read",
                config
            );
        });
        if (postProcessFile) {
            uploadPromise = uploadPromise.then(() => {
                return postProcessFile(filePath, uploadedUrl);
            })
        }
        return uploadPromise;
    }));
};
