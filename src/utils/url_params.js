/**
 * Parses the query args from a given url. Both #..&.. hash args as well as ?..&.. query args are supported.
 * @param {string} url - the url to parse the query args from
 * @param {object} params - key/value parameters to include as query args
 * @param {string} separatorString - string to separate the query args by
 * @param {string} paramChar - string to split the url from the query args
 * @param {boolean} decodeArgs - if true, decodes the query arg string first (useful for encoded hash args)
 * @returns {object} - object map of key/value query arg pairs
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
 * @param {string} url - the url with possible existing query args to update
 * @param {Object} params - key/value parameters to include as query args
 * @param {string} separatorString - string to separate the query args by
 * @param {string} paramChar - string to split the url from the query args
 * @returns {string} - the updated url
 */
export function updateQueryArgs(url, params, separatorString = "&", paramChar = "?") {
    const existingArgs = parseQueryArgs(url, separatorString, paramChar);
    if (!params) params = {};
    const updatedArgs = {...existingArgs, ...params};
    return setQueryArgs(url, updatedArgs, separatorString, paramChar);
}

/**
 * Sets the url's query args to the specified values. Both #..&.. hash args as well as ?..&.. query args are supported.
 * @param {string} url - the url with possible existing query args to replace
 * @param {Object} params - key/value parameters to include as query args
 * @param {string} separatorString - string to separate the query args by
 * @param {string} paramChar - string to split the url from the query args
 * @returns {string} - the updated url
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
 * @param {string} queryArgs - string of separated query args to parse
 * @param {string} separatorString - string to separate the query args by
 * @returns {object} - object map of key/value query arg pairs
 */
export function parseArgs(queryArgs, separatorString = '&') {
    const result = {};
    if (queryArgs) {
        queryArgs.split(separatorString).forEach(nameAndValue => {
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
 * Converts a key/value pairs into a url encoded query arg string, usable in urls.
 * @param {object} params - key/value parameters to use as query args
 * @param keyPrefix - optional key prefix to apply to each query arg name
 * @param {string} separatorString - string to separate the query args by
 * @returns {string} - url encoded query string
 */
export function encodeUrlParams(params, keyPrefix = undefined, separatorString = "&") {
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
