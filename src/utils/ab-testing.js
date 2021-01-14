/**
 * A/B testing support.
 */

/**
 * Returns true if the VAST configuration has choice card A/B test variants present.
 *
 * @param vastConfig
 * @return {Boolean}
 */
export function hasChoiceCardTestVariants(vastConfig) {
    return vastConfig && vastConfig.card_configurations && vastConfig.card_configurations.length > 1 || false;
}

/**
 * If the VAST configuration has choice card A/B test variants, returns choice card configurstion to used
 * for the specified user id. This is based on hashing the user id to an index, and returning the card
 * config at that index.
 *
 * @param {Object} vastConfig
 * @param {String} userId the user id to use for hashing to the choice card index. Defaults to the
 *   VAST config's user.id property if missing.
 * @return {Object} The choice card configuration chosen as the test variant, or null if multiple test
 *   variants are not present.
 */
export function getChoiceCardTestConfiguration(vastConfig, userId) {
    if (hasChoiceCardTestVariants(vastConfig)) {
        if (!userId) userId = vastConfig.user && vastConfig.user.id;
        if (userId) {
            // Hash the user id via the sum of its char codes.
            // Prevent sum from getting too large, using (A + B) mod N = (A mod N + B mod N) mod N
            var index = 0;
            const numCards = vastConfig.card_configurations.length;
            for(var i = 0; i < userId.length; i++) {
                index += userId.charCodeAt(i) % numCards;
                index = index % numCards;
            }
            return vastConfig.card_configurations[index];
        }
    }
    return null;
}
