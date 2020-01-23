/**
 * StripProtocol - returns a url without it's scheme
 * @param {string} url - the url to be stripped of the scheme
 * @returns {string} - the url stripped of the scheme
 */
const StripProtocol = (function() {
    const reg = /^(?:https?:|file:)/;
    return function(url) {
        if (reg.test(url)) {
            return url.replace(reg, '');
        }
        if (url.indexOf('//') !== 0) {
            return `//${url}`;
        }
        return url;
    };
})();

export default StripProtocol;
export { StripProtocol };
