const util = require('util');
const AWS = require('aws-sdk');
const getContentType = require("./content-type");

/**
 * getClient
 * @returns {object} s3 client instance
 */
const getClient = (function() {
    let s3Client;
    return function() {
        if (s3Client) {
            return s3Client;
        }
        s3Client = new AWS.S3({apiVersion: '2006-03-01'});
        return s3Client;
    };
})();

/**
 * listDirectory
 * @param {array} accumulator - array to accumulate listed files
 * @param {string} bucket - the s3 bucket
 * @param {string} prefix - the s3 prefix
 * @param {string} lastKey - the last key if the results were truncated
 * @returns {list} accumulator
 */
const listDirectory = (list, bucket, prefix, lastKey) => {
    if (!list) {
        list = [];
    }
    const s3Client = getClient();
    const params = {
        Bucket: bucket,
        Prefix: prefix,
    };

    if (lastKey) {
        params.NextMarker = lastKey;
    }

    return util.promisify(s3Client.listObjects.bind(s3Client))(
        params,
    ).then(data => {
        const keys = data.Contents.map(item => {
            return item.Key;
        });
        list.push(...keys);
        if (data.IsTruncated) {
            return listDirectory(list, bucket, prefix, keys[keys.length - 1]);
        }
        return list;
    });
};

module.exports = {
    /**
     * CleanFolder
     * Deletes all items in a folder
     * @param {string} bucket
     * @param {string} prefix
     * @returns {promise}
     */
    cleanFolder: function(bucket, prefix) {
        const s3Client = getClient();
        const deleteObjects = s3Client.deleteObjects.bind(s3Client);
        return listDirectory([], bucket, prefix).then(data => {
            if (!data.length) {
                return;
            }
            const params = {
                Bucket: bucket,
                Delete: {
                    Objects: data.map(key => {
                        return {Key: key};
                    }),
                },
            };
            return util.promisify(deleteObjects)(params);
        });
    },

    /**
     * uploadFile
     * @param {string} bucket
     * @param {string} key
     * @param body
     * @param {string} contentType
     * @param {string} acl 'private' (default), 'public-read', etc.
     * @param {Object} config options for S3 configuration for the file:
     * @param {config.cacheControl} Defaults to modest caching based on the type that allows for CDN updates.
     * @param {config.disableCache} Sets the cache-control to specify no caching should be done
     * @returns {promise}
     */
    uploadFile: function(bucket, key, body, contentType, acl = 'private', config = {}) {
        const s3Client = getClient();

        if (!contentType) {
            contentType = getContentType(key);
        }

        const params = {
            Bucket: bucket,
            ACL: acl,
            Key: key,
            Body: body,
            ContentType: contentType
        };

        if (config.disableCache) {
            params.CacheControl = 'no-cache, no-store, must-revalidate';
            params.Expires = 0;
        } else if (config.cacheControl) {
            params.CacheControl = config.cacheControl;
        } else {
            const sec = 1;
            const min = 60 * sec;
            const hour = 60 * min;
            const day = 24 * hour;
            let localMaxAge = 2 * min;
            let serverMaxAge = day;
            if (contentType.startsWith('font/')) {
                // Rarely changes.
                localMaxAge = 7 * day;
                serverMaxAge = 365 * day;
            } else if (contentType.startsWith('audio/')
                || contentType.startsWith('video/')) {
                // media assets are usually stable.
                localMaxAge = 7 * day;
                serverMaxAge = 120 * day;
            } else if (contentType.startsWith('image/')) {
                // images are reasonably stable.
                localMaxAge = 1 * day;
                serverMaxAge = 30 * day;
            }
            params.CacheControl = `max-age=${localMaxAge} s-maxage=${serverMaxAge} stale-while-revalidate=${5 * min}`;
        }

        return util.promisify(s3Client.putObject.bind(s3Client))(params)
            .catch(err => {
                console.error(`s3 upload failed for ${bucket}/${key}\n  error: ${err}`);
                throw err;
            });
    },
};
