import { describe, test } from 'node:test';
import assert from 'node:assert';
import { getHashedIndex } from '../get_hashed_index.js';

describe("getHashedIndex A/B test variants", () => {
    test("test with no variants", () => {
        const vastConfig = {
            "tag_type": "choice_card",
            "user": {
                "id": "test_html5_00005"
            },
            "card_configurations": [
                {
                    "name": "sample choice card"
                }
            ]
        };

        assert.strictEqual(getHashedIndex(vastConfig.user.id, vastConfig.card_configurations.length), 0);

        // Tolerate missing config
        assert.strictEqual(getHashedIndex(undefined), 0);
    });

    test("test with variants", () => {
        const user1 = "test-user-1";
        const user2 = "test-user-2";
        const vastConfig = {
            "tag_type": "choice_card",
            "user": {
                "id": user1
            },
            "card_configurations": [
                {
                    "name": "test variant A"
                },
                {
                    "name": "test variant B"
                }
            ]
        };

        assert.strictEqual(getHashedIndex(user1, vastConfig.card_configurations.length), 0);
        assert.strictEqual(getHashedIndex(user2, vastConfig.card_configurations.length), 1);
    });
});
