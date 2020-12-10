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
});

describe('parseQueryArgs', () => {
    it('should return the params of the url', () => {
        const url = "www.test.com?a=1&b=2";
        expect(parseQueryArgs(url, '&', '?')).toEqual({ a: '1', b: '2' });
    });
});
