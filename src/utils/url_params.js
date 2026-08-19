/**
 * @typedef {Record<string, string | undefined>} QueryParams
 * @typedef {Record<string, unknown>} UrlParams
 */

/**
 * Parses the query args from a given url. Both #..&.. hash args as well as ?..&.. query args are supported.
 * @param {string} url
 * @param {string} [separatorString]
 * @param {string} [paramChar]
 * @param {boolean} [decodeArgs] if true, decodes the query arg string first (useful for encoded hash args)
 * @returns {QueryParams}
 */
export function parseQueryArgs(url, separatorString = "&", paramChar = "?", decodeArgs = false) {
    const argsStart = url.indexOf(paramChar);

    // only standard `?..` query strings can have a separate hash `#..` fragment
    const fragmentStart = paramChar === "?"
        ? url.indexOf("#", argsStart + 1)
        : -1
    ;

    let queryArgs = (argsStart >= 0)
        ? url.substring(argsStart + 1, fragmentStart >= 0 ? fragmentStart : undefined)
        : ''
    ;

    if (decodeArgs) {
        queryArgs = decodeURIComponent(queryArgs);
    }

    return parseArgs(queryArgs, separatorString);
}

/**
 * Includes the specified parameters in the url's query args, replacing existing args as needed, adding them if missing.
 * Both #..&.. hash args as well as ?..&.. query args are supported.
 * @param {string} url
 * @param {UrlParams} [params]
 * @param {string} [separatorString]
 * @param {string} [paramChar]
 * @returns {string}
 */
export function updateQueryArgs(url, params, separatorString = "&", paramChar = "?") {
    params ??= {};

    const existingArgs = parseQueryArgs(url, separatorString, paramChar);
    const updatedArgs = { ...existingArgs, ...params };

    return setQueryArgs(url, updatedArgs, separatorString, paramChar);
}

/**
 * Sets the url's query args to the specified values. Both #..&.. hash args as well as ?..&.. query args are supported.
 * @param {string} url
 * @param {UrlParams} [params]
 * @param {string} [separatorString]
 * @param {string} [paramChar]
 * @returns {string}
 */
export function setQueryArgs(url, params, separatorString = "&", paramChar = "?") {
    if (!params) {
        params = {};
    }

    const fragmentStart = paramChar === "#" ? -1 : url.indexOf("#");
    const fragment = fragmentStart >= 0 ? url.substring(fragmentStart) : '';
    const urlWithoutFragment = fragmentStart >= 0 ? url.substring(0, fragmentStart) : url;
    const argsStart = urlWithoutFragment.indexOf(paramChar);
    const baseUrl = argsStart >= 0 ? urlWithoutFragment.substring(0, argsStart) : urlWithoutFragment;
    const queryArgsString = encodeUrlParams(params, undefined, separatorString);

    if (!queryArgsString) {
        return baseUrl + fragment;
    }

    return baseUrl + paramChar + queryArgsString + fragment;
}

/**
 * parseArgs - converts a string of query args into an object
 * @param {string | undefined} queryArgs
 * @param {string} [separatorString]
 * @returns {QueryParams}
 */
export function parseArgs(queryArgs, separatorString = '&') {
    /** @type {QueryParams} */
    const result = {};

    if (queryArgs) {
        for (const keyValuePair of queryArgs.split(separatorString)) {
            const separatorIndex = keyValuePair.indexOf('=');
            const rawKey = separatorIndex >= 0
                ? keyValuePair.slice(0, separatorIndex)
                : keyValuePair
            ;
            const rawValue = separatorIndex >= 0
                ? keyValuePair.slice(separatorIndex + 1)
                : ''
            ;

            const key = safeDecodeURIComponent(rawKey);

            if (key !== '__proto__') {
                result[key] = safeDecodeURIComponent(rawValue);
            }
        }
    }
    return result;
}

/**
 * Converts a key/value pairs into a url encoded query arg string, usable in urls.
 * @param {UrlParams} params
 * @param {string} [keyPrefix] prefix applied to each query arg name (used for nested objects)
 * @param {string} [separatorString]
 * @returns {string}
 */
export function encodeUrlParams(params, keyPrefix = undefined, separatorString = "&") {
    const pairs = [];

    for (const key in params) {
        if (!Object.prototype.hasOwnProperty.call(params, key)) {
            continue;
        }

        const value = params[key];

        // - don't try to serialize actual function members
        // - skip missing values.
        if (value instanceof Function || value == null) {
            continue;
        }

        // if we have a keyPrefix, it means we're within a nested object.
        // so we need to include it in our encoded key, in the form "keyPrefix[key]".
        const currentKey = keyPrefix
            ? encodeURIComponent(`${keyPrefix}[${key}]`)
            : encodeURIComponent(key)
        ;

        if (value instanceof Object) {
            if (value instanceof Date) {
                // Encode dates as scalar values.
                pairs.push(`${currentKey}=${encodeURIComponent(value.toString())}`);
            } else if (Object.keys(value).length > 0) {
                // Recurse into non-empty, non-scaler objects
                pairs.push(encodeUrlParams(/** @type {UrlParams} */(value), currentKey, separatorString));
            }
        } else {
            // Encode everything else (e.g. string, number, boolean).
            pairs.push(`${currentKey}=${encodeURIComponent(value.toString())}`);
        }
    }

    return pairs.join(separatorString);
}

/**
 * @param {string} value
 * @returns {string}
 */
function safeDecodeURIComponent(value) {
    // decodeURIComponent does not decode form-encoded `+` characters as spaces.
    value = value.replace(/\+/g, ' ');

    try {
        return decodeURIComponent(value);
    } catch (ignore) {
        return value;
    }
}
