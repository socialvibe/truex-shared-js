const REGEX_PROTOCOL = /^(?:https?:|file:)/;

/**
 * StripProtocol - returns a url without it's scheme
 * @param {string} url - the url to be stripped of the scheme
 * @returns {string} - the url stripped of the scheme
 */
const StripProtocol = (url) => {
    if (REGEX_PROTOCOL.test(url)) {
        return url.replace(REGEX_PROTOCOL, '');
    }
    if (url.indexOf('//') !== 0) {
        return `//${url}`;
    }
    return url;
};

export default StripProtocol;
export { StripProtocol };
