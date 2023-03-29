const fetch = require('node-fetch');

function invokeFastlyApi(path, apiToken) {
    if (path.startsWith('/')) path = path.substring(1);
    return fetch(`https://api.fastly.com/${path}`, {
        method: 'POST',
        headers: {
            "Fastly-Key": apiToken
        }
    });
}

function purgeFastlyUrl(url, apiToken) {
    console.log('fastly cache purge: ' + url);
    return invokeFastlyApi('/purge/' + url, apiToken);
}

function purgeFastlyService(serviceId, apiToken) {
    console.log('fastly cache service purge: ' + serviceId);
    return invokeFastlyApi(`/service/${serviceId}/purge_all`, apiToken);
}

module.exports = {
    purgeFastlyUrl,
    purgeFastlyService
};