import { v4 } from 'uuid';
import { uuid, isUuid } from 'uuidv4';

describe('uuid_polyfill-test', () => {
    test('initial uuid test in node', () => {
        // uuid 7.0.3 does in fact run in node, just not when built for the web browser in TAR
        const v = v4();
        expect(isUuid(v)).toBe(true);

        // Ensure polyfill is in NOT place.
        const crypto = global.crypto;
        expect(!crypto || !crypto.getRandomValues).toBe(true);
    });

    test('with uuid polyfilled', () => {
        const { getRandomValuesFallback } = require('../uuid-polyfill');
        const { TXMFocusManager }  = require('../../focus_manager/txm_focus_manager');

        // Ensure polyfill is in now place.
        expect(crypto && getRandomValuesFallback == crypto.getRandomValues).toBe(true);

        const v = uuid();
        expect(isUuid(v)).toBe(true);

        const fm1 = new TXMFocusManager();
        expect(isUuid(fm1.id)).toBe(true);

        const fm2 = new TXMFocusManager();
        expect(isUuid(fm2.id)).toBe(true);

        expect(fm1.id == fm2.id).toBe(false);
    });
});