/**
 * parseQueryArgs - parses the query args from a given url
 * @url {string} - string of the url to parse the query args from
 * @separatorString {string} - string to separate the query args by
 * @paramChar {string} - string to split the url from the query args
 * @decodeArgs {boolean} - boolean to determine decoding the query args
 * @returns {object} - object of the query args
 */
export function parseQueryArgs(url, separatorString = "&", paramChar = "?", decodeArgs = false) {
    const hashAt = url.indexOf(paramChar);
    let queryArgs = hashAt >= 0 && url.substr(hashAt+1);
    if (decodeArgs) {
        queryArgs = decodeURIComponent(queryArgs);
    }
    return parseArgs(queryArgs, separatorString);
};

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
 * encodeUrlParams - converts a keyvalue object into URLEncoded params
 * @param {object} - object of key and its corresponding values
 * @returns {string} - urlencoded query string
 */
export function encodeUrlParams(obj, keyPrefix) {
  const pairs = [];

  for (const key in obj) {
    if (!obj.hasOwnProperty(key)) {
      continue;
    }

    const value = obj[key];
    let currentKey;

    // If we have a keyPrefix, it means we're within a nested object.
    // So we need to include it in our encoded key, in the form "keyPrefix[key]".
    if (keyPrefix) {
      currentKey = `${keyPrefix}${encodeURIComponent('['+key+']')}`;
    }
    else {
      currentKey = encodeURIComponent(key);
    }

    if (value === undefined || value === null || value === "") {
        // Skip missing values.

    } else if (typeof value === 'object') {
        const isArray = value.constructor == Array;
        const isHash = value.constructor == Object;

        if (!isArray && !isHash) {
            // Encode scaler objects (e.g. Date)
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

  return pairs.join('&');
}
