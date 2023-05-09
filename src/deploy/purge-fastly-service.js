const fetch = require('node-fetch');

function invokeFastlyApi(path, apiToken, method = 'POST') {
    if (!path) throw new Error('missing fastly api path: ' + path);
    if (!apiToken) throw new Error('missing fastly api token for: ' + path);
    if (!path.startsWith('/')) path = '/' + path;

    return fetch(`https://api.fastly.com${path}`, {
        method: method,
        headers: {
            'Fastly-Key': apiToken,
            'Accept': 'application/json'
        }
    }).then(resp => {
        return resp.text()
            .then(responseText => {
                const jsonResponse = (responseText && responseText.startsWith('{')) ? JSON.parse(responseText) : undefined;
                if (resp.ok) return jsonResponse;

                const statusMsg = resp.status + (resp.statusText ? ' - ' + resp.statusText : '');
                let errMsg = `fastly action failed: ${statusMsg}\nfor ${path}`;
                if (responseText) errMsg += '\n' + responseText;
                console.error(errMsg);

                const err = new Error(errMsg);
                err.detail = jsonResponse || responseText;
                throw err;
            });
    });
}

function purgeFastlyUrl(url, apiToken) {
    if (url) url = url.replace(/^[a-zA-Z]+:\/\//, ''); // strip protocol
    console.log('fastly cache purge: ' + url);
    return invokeFastlyApi('/purge/' + url, apiToken);
}

function purgeFastlyService(serviceName, apiToken) {
    console.log('fastly cache service purge: ' + serviceName);
    return searchFastlyService(serviceName, apiToken).then(service => {
        return invokeFastlyApi(`/service/${service.id}/purge_all`, apiToken);
    });
}

function searchFastlyService(serviceName, apiToken) {
    return invokeFastlyApi(`/service/search?name=${serviceName}`, apiToken, 'GET');
}

module.exports = {
    purgeFastlyUrl,
    purgeFastlyService,
    searchFastlyService
};