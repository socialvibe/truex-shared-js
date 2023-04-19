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

    return accumulateFiles(distDir)
        .then((results) => {
            return Promise.all(
                flattenDeep(results).map((filePath) => {
                    return util
                        .promisify(fs.readFile)(filePath)
                        .then((fileData) => {
                            return { filePath, fileData };
                        });
                })
            );
        })
        .then((data) => {
            const uploadPromises = data.map((d) => {
                const key = path.join(
                    keyPrefix,
                    path.relative(path.resolve(distDir), d.filePath)
                );
                const contentType = getContentType(d.filePath);
                const uploadedUrl = bucket + '/' + key;
                console.log(`uploading file: ${uploadedUrl} ...`);
                let uploadPromise = s3.uploadFile(
                    bucket,
                    key,
                    d.fileData,
                    contentType,
                    "public-read",
                    config
                );
                if (postProcessFile) {
                    uploadPromise = uploadPromise.then(() => {
                        return postProcessFile(d.filePath, uploadedUrl);
                    })
                }
                return uploadPromise;
            });

            return Promise.all(uploadPromises);
    });
};
