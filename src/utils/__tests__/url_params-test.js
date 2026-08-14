import { describe, test } from 'node:test';
import assert from 'node:assert';
import { parseQueryArgs, encodeUrlParams, setQueryArgs, updateQueryArgs } from '../url_params.js';

describe("url_params tests", () => {
    describe('encodeUrlParams', () => {
        test('should return a query string of key=value', () => {
            const params = {a: 1, b: 2};
            assert.strictEqual(encodeUrlParams(params), 'a=1&b=2');
        });

        test('should urlencode special characters', () => {
            const params = {a: 'foo&', 'b@': 'bar'};
            assert.strictEqual(encodeUrlParams(params), 'a=foo%26&b%40=bar');
        });

        test('should encode objects recursively', () => {
            const params = {a: 1, b: 2, c: [1], d: {e: 0}, f: [], g: {}};
            assert.strictEqual(encodeUrlParams(params), 'a=1&b=2&c%5B0%5D=1&d%5Be%5D=0');
        });

        test('should skip missing values', () => {
            const params = {
                zero: 0,
                "false": false,
                empty: "",
                "null": null,
                "undefined": undefined,
                something: "else"
            };
            assert.strictEqual(encodeUrlParams(params), 'zero=0&false=false&empty=&something=else');
        });

        test('should tolerate functions, class instances', () => {
            const f = function () {
                return 1
            };
            f.a = 1;
            assert.strictEqual(encodeUrlParams(f), 'a=1');

            class Foo {
                constructor(value) {
                    this.value = value;
                }

                method() {
                    // should be ignored
                }
            }

            const foo = new Foo(123);
            assert.strictEqual(encodeUrlParams(foo), 'value=123');
        });

        test('should ignore function fields, handle dates', () => {
            const now = new Date();

            class Foo {
                constructor(value) {
                    this.value = value;
                }

                method() {
                    // should be ignored
                }
            }

            const params = {
                field: 123,
                foo: new Foo('foo'),
                date: now,
                method: function () {
                    return 1
                }
            }
            assert.strictEqual(encodeUrlParams(params), 'field=123&foo%5Bvalue%5D=foo&date=' + encodeURIComponent(now.toString()));
        });
    });

    test('parseQueryArgs', () => {
        const url = "www.test.com?a=1&b=2&empty=";
        assert.deepStrictEqual(parseQueryArgs(url, '&', '?'), {a: '1', b: '2', empty: ""});
    });

    test("setQueryArgs", () => {
        assert.strictEqual(
            setQueryArgs("www.test.com", {arg1: 'value with spaces', shouldBeIgnored: null, arg2: false}),
            "www.test.com?arg1=value%20with%20spaces&arg2=false"
        );
        assert.strictEqual(
            setQueryArgs("www.test.com?oldArg1=1&oldArg2=to-be-replaced", {arg1: 'new value', arg2: 'other-new-value'}),
            "www.test.com?arg1=new%20value&arg2=other-new-value"
        );
        assert.strictEqual(
            setQueryArgs("www.test.com", {arg1: 'hash-value', arg2: 2}, '&', '#'),
            "www.test.com#arg1=hash-value&arg2=2"
        );
    });

    test("updateQueryArgs", () => {
        assert.strictEqual(
            updateQueryArgs("www.test.com", {arg1: 'value with spaces', shouldBeIgnored: null, arg2: false}),
            "www.test.com?arg1=value%20with%20spaces&arg2=false"
        );
        assert.strictEqual(
            updateQueryArgs("www.test.com?oldArg1=1&oldArg2=to-be-replaced", {arg1: 'new value', arg2: 'other-new-value', oldArg2: 'replaced-value'}),
            "www.test.com?oldArg1=1&oldArg2=replaced-value&arg1=new%20value&arg2=other-new-value"
        );
        assert.strictEqual(
            updateQueryArgs("www.test.com", {arg1: 'hash-value', arg2: 2}, '&', '#'),
            "www.test.com#arg1=hash-value&arg2=2"
        );
    });
});
