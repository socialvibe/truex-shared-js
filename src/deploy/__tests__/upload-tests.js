const { purgeFastlyUrl } = require('../purge-fastly-service');
const s3 = require("../s3-upload");
const uploadDist = require("../upload-dist");
const path = require('path');

describe("s3 upload tests", () => {
    const apiToken = process.env.FASTLY_API_TOKEN;
    if (!apiToken) {
        test("upload tests skipped", () => {
            console.warn('upload tests skipped due to missing FASTLY_API_TOKEN value');
        });
        return;
    }

    test('test S3 upload with fastly cache control', () => {
        const bucket = "qa-media.truex.com";
        const bucketPath = "truex-shared/__tests__";

        function expectedCacheControl(fileUrl) {
            switch (path.extname(fileUrl).toLowerCase()) {
                case '.html': return 'max-age=120 s-maxage=86400 stale-while-revalidate=300';
                case '.js': return 'max-age=120 s-maxage=86400 stale-while-revalidate=300';
                case '.json': return 'max-age=120 s-maxage=86400 stale-while-revalidate=300';
                case '.png': return 'max-age=120 s-maxage=86400 stale-while-revalidate=300';
                case '.ttf': return 'max-age=120 s-maxage=86400 stale-while-revalidate=300';
                case '.png': return 'max-age=120 s-maxage=86400 stale-while-revalidate=300';
                case '.mp4': return 'max-age=120 s-maxage=86400 stale-while-revalidate=300';
                case '.mp3': return 'max-age=120 s-maxage=86400 stale-while-revalidate=300';
                default: throw new Error('unknown extension: ' + fileUrl);
            }
        }

        return s3.cleanFolder(bucket, bucketPath + '/').then(() => {
            return uploadDist(bucket, bucketPath, './src/deploy/__tests__/', {}, (filePath, fileUrl) => {
                return purgeFastlyUrl(fileUrl, process.env.FASTLY_API_TOKEN).then(() => {
                    return fetch(fileUrl).then(resp => {
                        if (!resp.ok) throw new Error('could not fetch: ' + fileUrl);
                        expect(resp.headers.cacheControl).toBe(expectedCacheControl(fileUrl));
                    });
                });
            });
        });
    });
});
