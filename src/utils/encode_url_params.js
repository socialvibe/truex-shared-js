/**
 * encodeUrlParams - converts a keyvalue object into URLEncoded params
 * @param {object} - object of key and its corresponding values
 * @returns {string} - urlencoded query string
 */
const encodeUrlParams = (params, prefix) => {
    console.log("encoding params!!!");
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

export { encodeUrlParams };
