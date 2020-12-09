/**
 * decodeUrlParams - converts a keyvalue object into URLEncoded params
 * @param {object} - object of key and its corresponding values
 * @returns {string} - urlencoded query string
 */
export function decordUrlParams(url, splitString = "&", paramChar = "?") {
    console.log("decodeUrlParams");
    console.log(url);
    const hashAt = url.indexOf(paramChar);
    const engagementQueryArgs = hashAt >= 0 && decodeURIComponent(url.substr(hashAt+1));
    console.log(engagementQueryArgs);
    return parseQueryArgs(engagementQueryArgs, splitString);
};

const parseQueryArgs = (queryArgs, splitString) => {
    console.log("parseQueryArgs");
    const result = {};
    if (queryArgs) {
        queryArgs.split(splitString).forEach(nameAndValue => {
            const parts = nameAndValue.split('=');
            const name = decodeURIComponent(parts[0]);
            var value;
            try {
                // Tolerate malformed values
                value = parts[1] && decodeURIComponent(parts[1]);
            } catch (ignore) {
                value = parts[1];
            }
            result[name] = value;
        });
    }
    return result;
};

/**
 * encodeUrlParams - converts a keyvalue object into URLEncoded params
 * @param {object} - object of key and its corresponding values
 * @returns {string} - urlencoded query string
 */
export function encodeUrlParams (params, prefix) {
    const encodedParams = Object.keys(params).map(name => {
        const value = params[name];
        if (value === undefined) {
            return undefined; // no value
        }
        const encodedName =  encodeURIComponent(prefix ? prefix + '[' + name + ']' : name);
        const encodedValue = encodeURIComponent(value);
        return encodedName + '=' + encodedValue;
    }).filter(field => field != undefined).join('&');
    return encodedParams;
};
