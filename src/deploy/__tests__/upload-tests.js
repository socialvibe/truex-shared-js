const { purgeFastlyUrl } = require('../purge-fastly-service');
const s3 = require("../s3-upload");
const { getContentType, getContentCacheControl } = require("../content-type");
const uploadDist = require("../upload-dist");
const path = require('path');

describe("s3 upload tests", () => {
    function expectedCacheControl(filePath) {
        // @TODO: ensure the expected cache-control results are actually correct.
        switch (path.extname(filePath).toLowerCase()) {
            case '.html': return 'max-age=120 s-maxage=86400 stale-while-revalidate=300';
            case '.js': return 'max-age=120 s-maxage=86400 stale-while-revalidate=300';
            case '.json': return 'max-age=120 s-maxage=86400 stale-while-revalidate=300';
            case '.ttf': return 'max-age=604800 s-maxage=31536000 stale-while-revalidate=300';
            case '.jpg':
            case '.png': return 'max-age=86400 s-maxage=2592000 stale-while-revalidate=300';
            case '.mp4': return 'max-age=604800 s-maxage=10368000 stale-while-revalidate=300';
            case '.mp3': return 'max-age=604800 s-maxage=10368000 stale-while-revalidate=300';
            default: throw new Error('unknown extension: ' + filePath);
        }
    }

    test("cache control tests", () => {
        function testFile(filePath) {
            const expectedCC = expectedCacheControl(filePath);
            const contentType = getContentType(filePath);
            const defaultCC = getContentCacheControl(contentType);
            expect(defaultCC).toBe(expectedCC);
        }

        testFile('html_stub.html');
        testFile('js_stub.js');
        testFile('data_stub.json');
        testFile('image_stub.png');
        testFile('image_stub.jpg');
        testFile('font_stub.ttf');
        testFile('audio_stub.mp3');
        testFile('video_stub.mp4');
    });

    test('test S3 upload with fastly cache control', () => {
        if (!process.env.FASTLY_API_TOKEN || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
            console.warn('test skipped due to missing AWS_ACCESS_* or FASTLY_API_TOKEN env values');
            return;
        }

        const bucket = "qa-media.truex.com";
        const bucketPath = "truex-shared/__tests__";

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
