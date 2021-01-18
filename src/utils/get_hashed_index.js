/**
 * Returns an index within 0..count-1 by hashing over the characters in the name.
 *
 * @param {String} The name to hash over.
 * @param {Number} count the user id to use for hashing to the choice card index. Defaults to the
 *   VAST config's user.id property if missing.
 * @return {Number}
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
