const { purgeFastlyUrl } = require('../purge-fastly-service');

describe("fastly tests", () => {
    const apiToken = process.env.FASTLY_API_TOKEN;
    if (!apiToken) {
        test("fastly tests skipped", () => {
            console.warn('fastly tests skipped due to missing FASTLY_API_TOKEN value');
        });
        return;
    }

    test('test purgeFastlyFile', () => {
        return purgeFastlyUrl('https://qa-media.truex.com/container/3.x/current/ctv.html', apiToken)
            .then(() => purgeFastlyUrl('https://media.truex.com/container/3.x/current/ctv.html', apiToken));
    });
});