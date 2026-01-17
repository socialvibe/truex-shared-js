import { describe, it } from 'node:test';
import assert from 'node:assert';
import StripProtocol from '../strip_protocol.js';

describe('StripProtocol', () => {
    it('removes the http: scheme from urls', () => {
        const test = 'http://google.com';
        assert.strictEqual(StripProtocol(test), '//google.com');
    });

    it('removes the https: scheme from urls', () => {
        const test = 'https://google.com';
        assert.strictEqual(StripProtocol(test), '//google.com');
    });

    it('removes the file: scheme from urls', () => {
        const test = 'file://google.com';
        assert.strictEqual(StripProtocol(test), '//google.com');
    });

    it('returns a protocol-less url as-is', () => {
        const test = '//google.com';
        assert.strictEqual(StripProtocol(test), test);
    });

    it('prepends urls with forward slashes if they are protocol-less without slashes', () => {
        const test = 'google.com';
        assert.strictEqual(StripProtocol(test), '//' + test);
    });
});
