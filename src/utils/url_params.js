/**
 * Parses the query args from a given url. Both #..&.. hash args as well as ?..&.. query args are supported.
 * @param url {string} - string of the url to parse the query args from
 * @param separatorString {string} - string to separate the query args by
 * @param paramChar {string} - string to split the url from the query args
 * @param decodeArgs {boolean} - if true, decodes the query arg string first (useful for encoded hash args)
 * @returns {object} - object of the query args
 */
export function parseQueryArgs(url, separatorString = "&", paramChar = "?", decodeArgs = false) {
    const argsStart = url.indexOf(paramChar);
    let queryArgs = argsStart >= 0 && url.substring(argsStart+1);
    if (decodeArgs) {
        queryArgs = decodeURIComponent(queryArgs);
    }
    return parseArgs(queryArgs, separatorString);
}

/**
 * Includes the specified parameters in the url's query args, replacing existing args as needed, adding them if missing.
 * Both #..&.. hash args as well as ?..&.. query args are supported.
 * @param url - the url to update
 * @param params {Object} - key/value parameter map to include * @param separatorString
 * @param url {string} - string of the url to parse the query args from
 * @param separatorString {string} - string to separate the query args by
 * @param paramChar {string} - string to split the url from the query args
 * @returns {string}
 */
export function updateQueryArgs(url, params, separatorString = "&", paramChar = "?") {
    const existingArgs = parseQueryArgs(url, separatorString, paramChar);
    if (!params) params = {};
    const updatedArgs = {...existingArgs, ...params};
    return setQueryArgs(url, updatedArgs, separatorString, paramChar);
}

/**
 * Sets the url's query args to the specified values. Both #..&.. hash args as well as ?..&.. query args are supported.
 * @param url - the url to update
 * @param params {Object} - key/value parameter map to include * @param separatorString
 * @param url {string} - string of the url to parse the query args from
 * @param separatorString {string} - string to separate the query args by
 * @param paramChar {string} - string to split the url from the query args
 * @returns {string}
 */
export function setQueryArgs(url, params, separatorString = "&", paramChar = "?") {
    if (!params) params = {};
    const argsStart = url.indexOf(paramChar);
    const baseUrl = argsStart > 0 ? url.substring(0, argsStart) : url;
    if (Object.keys(params).length <= 0) return baseUrl; // no args present
    let queryArgsString = encodeUrlParams(params, undefined, separatorString);
    return baseUrl + paramChar + queryArgsString;
}

/**
 * parseArgs - converts a string of query args into an object
 * @queryArgs {string} - string of the query args
 * @separatorString {string} - string to separate the query args by
 * @returns {object} - object of the query args
 */
export function parseArgs(queryArgs, splitString) {
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
 * encodeUrlParams - converts a key/value pairs into URLEncoded params
 * @param {object} - object of key and its corresponding values
 * @returns {string} - urlencoded query string
 */
export function encodeUrlParams(params, keyPrefix, separatorString = "&") {
  const pairs = [];

  for (const key in params) {
    if (!params.hasOwnProperty(key)) {
      continue;
    }

    const value = params[key];

    // Don't try to serialize actual function members
    if (value instanceof Function) continue;

    let currentKey;

    // If we have a keyPrefix, it means we're within a nested object.
    // So we need to include it in our encoded key, in the form "keyPrefix[key]".
    if (keyPrefix) {
      currentKey = `${keyPrefix}${encodeURIComponent('['+key+']')}`;
    }
    else {
      currentKey = encodeURIComponent(key);
    }

    if (value === undefined || value === null) {
        // Skip missing values.

    } else if (value instanceof Object) {
        if (value instanceof Date) {
            // Encode dates as scalar values.
            pairs.push(`${currentKey}=${encodeURIComponent(value.toString())}`);
        } else if (Object.keys(value).length > 0) {
            // Recurse into non-empty, non-scaler objects
            pairs.push(encodeUrlParams(value, currentKey));
        }

    } else {
      // Encode everything else (e.g. string, number, boolean).
      pairs.push(`${currentKey}=${encodeURIComponent(value.toString())}`);
    }
  }

  return pairs.join(separatorString);
}
