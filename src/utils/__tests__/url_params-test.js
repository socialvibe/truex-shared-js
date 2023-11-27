import { parseQueryArgs, encodeUrlParams } from '../url_params';

describe('encodeUrlParams', () => {
    it('should return a query string of key=value', () => {
        const params = { a: 1, b: 2 };
        expect(encodeUrlParams(params)).toBe('a=1&b=2');
    });

    it('should urlencode special characters', () => {
        const params = { a: 'foo&', 'b@': 'bar' };
        expect(encodeUrlParams(params)).toBe('a=foo%26&b%40=bar');
    });

    it('should encode objects recursively', () => {
        const params = { a: 1, b: 2, c: [1], d: {e: 0}, f: [], g: {} };
        expect(encodeUrlParams(params)).toBe('a=1&b=2&c%5B0%5D=1&d%5Be%5D=0');
    });

    it('should skip missing values', () => {
        const params = { zero: 0, "false": false, empty: "", "null": null, "undefined": undefined, something: "else" };
        expect(encodeUrlParams(params)).toBe('zero=0&false=false&empty=&something=else');
    });

    it('should tolerate functions, class instances', () => {
        const f = function() {return 1};
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

    it('should ignore function fields, handle dates', () => {
        const now = new Date();
        const params = {
            field: 123,
            date: now,
            method: function() {
                return 1
            }
        }
        expect(encodeUrlParams(params)).toBe('field=123&date=' + encodeURIComponent(now.toString()));
    });
});

describe('parseQueryArgs', () => {
    it('should return the params of the url', () => {
        const url = "www.test.com?a=1&b=2&empty=";
        expect(parseQueryArgs(url, '&', '?')).toEqual({ a: '1', b: '2', empty: "" });
    });
});
