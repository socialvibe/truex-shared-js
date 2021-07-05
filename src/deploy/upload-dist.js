// public modules
const util = require("util");
const fs = require("fs");
const path = require("path");

const s3 = require("s3-upload");
const accumulateFiles = require("./accumulate-files");
const getContentType = require("./content-type");

// helper function to flatten array
const flattenDeep = (arr) => {
    return arr.reduce(
        (acc, val) =>
            Array.isArray(val) ? acc.concat(flattenDeep(val)) : acc.concat(val),
        []
    );
};

module.exports = (bucket, keyPrefix, sourcePath = "./dist", config = {}) => {
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
                console.log(`uploaded file: ${bucket}/${key}`);
                return s3.uploadFile(
                    bucket,
                    key,
                    d.fileData,
                    contentType,
                    "public-read",
                    config
                );
            });

            return Promise.all(uploadPromises);
        });
};
