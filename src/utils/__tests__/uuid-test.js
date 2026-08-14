import { describe, test } from 'node:test';
import assert from 'node:assert';
import { uuid, uuidv4 } from '../uuid.js';

const UUID_V4 = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;

describe('uuidv4', () => {
    test('uuidv4 and uuid are the same function', () => {
        assert.strictEqual(uuid, uuidv4);
    });

    test('returns an RFC 4122 v4 string', () => {
        const value = uuidv4();
        assert.match(value, UUID_V4);
    });

    test('returns a different value on each call', () => {
        assert.notStrictEqual(uuidv4(), uuidv4());
    });

    test('still produces v4 ids without crypto.getRandomValues', () => {
        const originalCrypto = globalThis.crypto;
        Object.defineProperty(globalThis, 'crypto', {
            configurable: true,
            value: undefined
        });
        try {
            const value = uuidv4();
            assert.match(value, UUID_V4);
        } finally {
            Object.defineProperty(globalThis, 'crypto', {
                configurable: true,
                value: originalCrypto
            });
        }
    });
});
