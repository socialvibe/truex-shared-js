/**
 * RFC 4122 UUID v4. Works without `crypto` / `Uint8Array` (Chrome 4, PS4 WebMAF).
 * Uses `crypto.getRandomValues` when both it and `Uint8Array` exist.
 * @returns {number} 0..15
 */
function randomNibble() {
    var cryptoObj = typeof crypto !== 'undefined' ? crypto : undefined;
    if (cryptoObj && typeof cryptoObj.getRandomValues === 'function' && typeof Uint8Array === 'function') {
        var bytes = new Uint8Array(1);
        cryptoObj.getRandomValues(bytes);
        return bytes[0] & 0xf;
    }
    return Math.random() * 16 | 0;
}

/**
 * RFC 4122 UUID v4 (`xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`, y in 8/9/a/b).
 * @returns {string}
 */
export function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = randomNibble();
        var v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export { uuidv4 as uuid };
export default uuidv4;
