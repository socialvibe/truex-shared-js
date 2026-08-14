/**
 * Returns an index within 0..count-1 by hashing over the characters in the name.
 *
 * @param {string} [name] string to hash over
 * @param {number} count number of buckets; returns 0 unless count > 1
 * @returns {number} index in `0..count-1`
 */
export function getHashedIndex(name, count) {
    if (name && count > 1) {
        // Hash the user id via the sum of its char codes.
        // Prevent sum from getting too large, using (A + B) mod N = (A mod N + B mod N) mod N
        var index = 0;
        for(var i = 0; i < name.length; i++) {
            index += name.charCodeAt(i);
        }
        return index % count;
    }
    return 0;
}

export default getHashedIndex;
