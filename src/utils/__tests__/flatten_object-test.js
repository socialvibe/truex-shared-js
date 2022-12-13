import {flattenObject} from "../flatten_object";

describe('flattenObject', () => {
    it('should flatten simple objects', () => {
        const obj = {
            a: "simple",
            "b": "object"
        };

        const flattened = flattenObject(obj);
        expect(flattened).toEqual({ a: 'simple', b: 'object' });
    });

    it('should flatten nested objects', () => {
        const obj = {
            "hello": "world",
            "nested": {
                "nestedKey": "nestedValue",
                "nested2": {
                    "depth2": "nestedValue2"
                }
            }
        };

        const flattened = flattenObject(obj);
        expect(flattened).toEqual({
            hello: "world",
            "nested[nestedKey]": "nestedValue",
            "nested[nested2][depth2]": "nestedValue2",
        });
    });

    it('should flatten arrays', () => {
        const obj = {
            "nonarray" : "hello world",
            "array": ["hello", "world"]
        };

        const flattened = flattenObject(obj);

        // This is currently not working and ignores arrays for flattens.  Designed to fail once it is implemented and the tests should be updated
        expect(flattened).toEqual({nonarray: "hello world"});
    });

    it('should return itself for non-objects', () => {
        let flattened = flattenObject("non object");
        console.log("flattened:", flattened)
        expect(flattened).toEqual("non object");

        flattened = flattenObject(123);
        console.log("flattened:", flattened)
        expect(flattened).toEqual(123);

        flattened = flattenObject(null);
        console.log("flattened:", flattened)
        expect(flattened).toEqual(null);
    });
});