/**
 * decodeUrlParams - converts a keyvalue object into URLEncoded params
 * @param {object} - object of key and its corresponding values
 * @returns {string} - urlencoded query string
 */
const decodeUrlParams = (url, splitString = "&", paramChar = "?") => {
    const hashAt = url.indexOf(paramChar);
    const engagementQueryArgs = hashAt >= 0 && decodeURIComponent(url.substr(hashAt+1));
    return parseQueryArgs(engagementQueryArgs, splitString);
};

const parseQueryArgs = (queryArgs, splitString) => {
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

export { decodeUrlParams };