import StripProtocol from '../strip_protocol';

describe('StripProtocol', () => {
    it('removes the http: scheme from urls', () => {
        const test = 'http://google.com';
        expect(StripProtocol(test)).toBe('//google.com');
    });

    it('removes the https: scheme from urls', () => {
        const test = 'https://google.com';
        expect(StripProtocol(test)).toBe('//google.com');
    });

    it('removes the file: scheme from urls', () => {
        const test = 'file://google.com';
        expect(StripProtocol(test)).toBe('//google.com');
    });

    it('returns a protocol-less url as-is', () => {
        const test = '//google.com';
        expect(StripProtocol(test)).toBe(test);
    });

    it('prepends urls with forward slashes if they are protocol-less without slashes', () => {
        const test = 'google.com';
        expect(StripProtocol(test)).toBe('//' + test);
    });
});
