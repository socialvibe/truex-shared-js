import {
    hasChoiceCardTestVariants,
    getChoiceCardTestConfiguration  } from './../ab-testing';

describe("A/B test variants", () => {
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
        }

        expect(hasChoiceCardTestVariants(vastConfig)).toBe(false);
        expect(getChoiceCardTestConfiguration(vastConfig)).toBe(null);

        // Tolerate missing config
        expect(hasChoiceCardTestVariants(undefined)).toBe(false);
        expect(getChoiceCardTestConfiguration(undefined)).toBe(null);
    });

    test("test with with variants", () => {
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

        expect(hasChoiceCardTestVariants(vastConfig)).toBe(true);
        expect(getChoiceCardTestConfiguration(vastConfig)).toBe(vastConfig.card_configurations[0]);
        expect(getChoiceCardTestConfiguration(vastConfig, user2)).toBe(vastConfig.card_configurations[1]);
    });
});