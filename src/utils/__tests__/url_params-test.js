import { parseQueryArgs, encodeUrlParams, setQueryArgs, updateQueryArgs } from '../url_params';

describe("url_params tests", () => {
    describe('encodeUrlParams', () => {
        test('should return a query string of key=value', () => {
            const params = {a: 1, b: 2};
            expect(encodeUrlParams(params)).toBe('a=1&b=2');
        });

        test('should urlencode special characters', () => {
            const params = {a: 'foo&', 'b@': 'bar'};
            expect(encodeUrlParams(params)).toBe('a=foo%26&b%40=bar');
        });

        test('should encode objects recursively', () => {
            const params = {a: 1, b: 2, c: [1], d: {e: 0}, f: [], g: {}};
            expect(encodeUrlParams(params)).toBe('a=1&b=2&c%5B0%5D=1&d%5Be%5D=0');
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
            expect(encodeUrlParams(params)).toBe('zero=0&false=false&empty=&something=else');
        });

        test('should tolerate functions, class instances', () => {
            const f = function () {
                return 1
            };
            f.a = 1;
            expect(encodeUrlParams(f)).toBe('a=1');

            class Foo {
                constructor(value) {
                    this.value = value;
                }

                method() {
                    // should be ignored
                }
            }

            const foo = new Foo(123);
            expect(encodeUrlParams(foo)).toBe('value=123');
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
            expect(encodeUrlParams(params)).toBe('field=123&foo%5Bvalue%5D=foo&date=' + encodeURIComponent(now.toString()));
        });
    });

    test('parseQueryArgs', () => {
        const url = "www.test.com?a=1&b=2&empty=";
        expect(parseQueryArgs(url, '&', '?')).toEqual({a: '1', b: '2', empty: ""});
    });

    test("setQueryArgs", () => {
        expect(setQueryArgs("www.test.com", {arg1: 'value with spaces', shouldBeIgnored: null, arg2: false}))
            .toBe("www.test.com?arg1=value%20with%20spaces&arg2=false");
        expect(setQueryArgs("www.test.com?oldArg1=1&oldArg2=to-be-replaced", {arg1: 'new value', arg2: 'other-new-value'}))
            .toBe("www.test.com?arg1=new%20value&arg2=other-new-value");
        expect(setQueryArgs("www.test.com", {arg1: 'hash-value', arg2: 2}, '&', '#'))
            .toBe("www.test.com#arg1=hash-value&arg2=2");
    })

    test("updateQueryArgs", () => {
        expect(updateQueryArgs("www.test.com", {arg1: 'value with spaces', shouldBeIgnored: null, arg2: false}))
            .toBe("www.test.com?arg1=value%20with%20spaces&arg2=false");
        expect(updateQueryArgs("www.test.com?oldArg1=1&oldArg2=to-be-replaced", {arg1: 'new value', arg2: 'other-new-value', oldArg2: 'replaced-value'}))
            .toBe("www.test.com?oldArg1=1&oldArg2=replaced-value&arg1=new%20value&arg2=other-new-value");
        expect(updateQueryArgs("www.test.com", {arg1: 'hash-value', arg2: 2}, '&', '#'))
            .toBe("www.test.com#arg1=hash-value&arg2=2");
    })
});