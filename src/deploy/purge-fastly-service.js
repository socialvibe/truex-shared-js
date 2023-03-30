const fetch = require('node-fetch');

function invokeFastlyApi(path, apiToken) {
    if (!path) throw new Error('missing fastly api path: ' + path);
    if (!apiToken) throw new Error('missing fastly api token for: ' + path);
    if (path.startsWith('/')) path = path.substring(1);
    return fetch(`https://api.fastly.com/${path}`, {
        method: 'POST',
        headers: {
            "Fastly-Key": apiToken
        }
    }).then(resp => {
        if (resp.ok) return;
        const statusMsg = resp.status + (resp.statusText ? ' - ' + resp.statusText : '');
        const errMsg = `fastly action failed: ${statusMsg}\nfor ${path}`;
        console.error(errMsg);
        throw new Error(errMsg);
    });
}

function purgeFastlyUrl(url, apiToken) {
    if (url) url = url.replace(/^[a-zA-Z]+:\/\//g, ''); // strip protocol
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