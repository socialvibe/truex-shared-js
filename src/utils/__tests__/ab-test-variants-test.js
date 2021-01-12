import {
    hasTestVariants,
    getTestCardConfiguration,
    getTestVariant } from './../ab-testing';

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

        expect(hasTestVariants(vastConfig)).toBe(false);
        expect(getTestCardConfiguration(vastConfig)).toBe(null);
        expect(getTestVariant(vastConfig)).toBe(null);

        // Tolerate missing config
        expect(hasTestVariants(undefined)).toBe(false);
        expect(getTestCardConfiguration(undefined)).toBe(null);
        expect(getTestVariant(undefined)).toBe(null);
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

        expect(hasTestVariants(vastConfig)).toBe(true);
        expect(getTestCardConfiguration(vastConfig)).toBe(vastConfig.card_configurations[0]);
        expect(getTestVariant(vastConfig)).toBe(vastConfig.card_configurations[0].name);

        expect(getTestCardConfiguration(vastConfig, user2)).toBe(vastConfig.card_configurations[1]);
        expect(getTestVariant(vastConfig, user2)).toBe(vastConfig.card_configurations[1].name);
    });
});