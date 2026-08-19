import { describe, test } from 'node:test';
import assert from 'node:assert';
import { parseQueryArgs, parseArgs, encodeUrlParams, setQueryArgs, updateQueryArgs } from '../url_params.js';

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
            assert.strictEqual(encodeUrlParams({a: {b: 1, c: 2}, d: 3}, undefined, ';'), 'a%5Bb%5D=1;a%5Bc%5D=2;d=3');
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

            const paramsWithoutPrototype = Object.assign(Object.create(null), {a: 1});
            assert.strictEqual(encodeUrlParams(paramsWithoutPrototype), 'a=1');
            assert.strictEqual(encodeUrlParams({hasOwnProperty: 'value', a: 1}), 'hasOwnProperty=value&a=1');
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
            assert.strictEqual(
                encodeUrlParams(params),
                'field=123&foo%5Bvalue%5D=foo&date=' + encodeURIComponent(now.toString())
            );
        });
    });

    test('parseQueryArgs', () => {
        const url = "www.test.com?a=1&b=2&empty=";
        assert.deepStrictEqual(parseQueryArgs(url, '&', '?'), {a: '1', b: '2', empty: ""});
        assert.deepStrictEqual(parseQueryArgs("www.test.com"), {});
        assert.deepStrictEqual(parseQueryArgs("www.test.com?a=1#section"), {a: '1'});
        assert.deepStrictEqual(parseQueryArgs("www.test.com#section?tab=details"), {});
    });

    test('parseArgs', () => {
        assert.deepStrictEqual(
            parseArgs('missing&empty=&token=a=b=c&bad%ZZ=value&badValue=%ZZ&q=hello+world&literalPlus=hello%2Bworld&duplicate=first&duplicate=last&=vasya'),
            {
                '': "vasya",
                missing: '',
                empty: '',
                token: 'a=b=c',
                'bad%ZZ': 'value',
                badValue: '%ZZ',
                q: 'hello world',
                literalPlus: 'hello+world',
                duplicate: 'last'
            }
        );

        const reservedNames = parseArgs('__proto__=value&%5F%5Fproto%5F%5F=encoded&constructor=other&safe=value');
        assert.deepStrictEqual(Object.keys(reservedNames), ['constructor', 'safe']);
        assert.strictEqual(Object.hasOwn(reservedNames, '__proto__'), false);
        assert.strictEqual(reservedNames.constructor, 'other');
        assert.strictEqual(reservedNames.safe, 'value');
        assert.strictEqual(Object.getPrototypeOf(reservedNames), Object.prototype);
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
        assert.strictEqual(setQueryArgs("?old=1", {next: 2}), "?next=2");
        assert.strictEqual(setQueryArgs("www.test.com?old=1#section", {next: 2}), "www.test.com?next=2#section");
        assert.strictEqual(setQueryArgs("www.test.com#section", {next: 2}), "www.test.com?next=2#section");
        assert.strictEqual(setQueryArgs("www.test.com?old=1#section", {next: null}), "www.test.com#section");
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
        assert.strictEqual(
            updateQueryArgs("www.test.com?old=1#section", {next: 2}),
            "www.test.com?old=1&next=2#section"
        );
    });
});
