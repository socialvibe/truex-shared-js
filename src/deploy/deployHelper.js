
const getS3BucketPath = (branch) => {
    return `branch-test/skyline/${branch.replace(/[^a-z0-9_\-]/gi, "_").toLowerCase()}`;
};

module.exports = {
    getS3BucketPath
}