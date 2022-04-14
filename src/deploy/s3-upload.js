const util = require('util');
const AWS = require('aws-sdk');

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
     * @param {string} acl (default='private')
     * @param config
     * @returns {promise}
     */
    uploadFile: function(bucket, key, body, contentType, acl = 'private', config) {
        const s3Client = getClient();

        const params = {
            Bucket: bucket,
            ACL: acl,
            Key: key,
            Body: body,
            ContentType: contentType
        };

        if (config && config.disableCache === true) {
            params.CacheControl = 'no-cache, no-store, must-revalidate';
            params.Expires = 0;
        }

        return util.promisify(s3Client.putObject.bind(s3Client))(params)
            .catch(err => {
                console.error(`s3 upload failed for ${bucket}/${key}\n  error: ${err}`);
                throw err;
            });
    },
};
