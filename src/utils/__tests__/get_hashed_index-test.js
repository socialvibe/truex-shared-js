import { getHashedIndex  } from '../get_hashed_index';

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

        expect(getHashedIndex(vastConfig.user.id, vastConfig.card_configurations.length)).toBe(0);

        // Tolerate missing config
        expect(getHashedIndex(undefined)).toBe(0);
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

        expect(getHashedIndex(user1, vastConfig.card_configurations.length)).toBe(0);
        expect(getHashedIndex(user2, vastConfig.card_configurations.length)).toBe(1);
    });
});