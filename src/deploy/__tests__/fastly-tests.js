const { purgeFastlyUrl, purgeFastlyService, searchFastlyService } = require('../purge-fastly-service');

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

    test('test bad searchFastlyService', () => {
        const unknownService = 'unknown.truex.com';
        return searchFastlyService(unknownService, apiToken)
            .then(service => {
                throw new Error('service search should not succeed');
            })
            .catch(error => {
                expect(error.message).toContain('Not Found');
                expect(error.message).toContain(unknownService);
            });
    });

    const qaMedia = 'qa-media.truex.com';

    test('test good searchFastlyService', () => {
        return searchFastlyService(qaMedia, apiToken)
            .then(service => {
                expect(service.name).toBe(qaMedia);
                expect(service.id).toBeDefined();
                console.log(`service id for ${qaMedia} is ${service.id}`);
            });
    });

    test('test purgeFastlyService', () => {
        return purgeFastlyService(qaMedia, apiToken)
            .then(result => {
                console.log(`purge result: ${JSON.stringify(result)}`);
            });
    });
});