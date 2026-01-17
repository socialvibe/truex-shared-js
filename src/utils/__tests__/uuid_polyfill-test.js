import { describe, test } from 'node:test';
import assert from 'node:assert';
import pkg from 'uuid';
const { v4: uuid } = pkg;
import { getRandomValuesFallback } from "../uuid-polyfill.js";

describe('uuid_polyfill-test', () => {

    // Lifted from the uuidv4 npm module. We can't use that module directly since it does not run on
    // the PS4 due to its lack of ES6 support for some outstanding const declarations in the
    // final deployed code of uuidv4.js.
    function isUuid(value) {
        const regex = {
            v4: /(?:^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12}$)|(?:^0{8}-0{4}-0{4}-0{4}-0{12}$)/u,
            v5: /(?:^[a-f0-9]{8}-[a-f0-9]{4}-5[a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12}$)|(?:^0{8}-0{4}-0{4}-0{4}-0{12}$)/u
        };
        return regex.v4.test(value) || regex.v5.test(value);
    }

    test('initial uuid test in node', () => {
        // uuid 7.0.3 does in fact run in node, just not when built for the web browser in TAR
        const v = uuid();
        assert.strictEqual(isUuid(v), true);

        const crypto = global.crypto;

        // Tolerate polyfill already being in place, due to updated dependencies
        const hasCrypto = crypto && !!crypto.getRandomValues;
        if (hasCrypto) return;

        // Ensure polyfill is in NOT place.
        assert.strictEqual(!crypto || !crypto.getRandomValues, true);
    });

    test('with uuid polyfilled', async () => {
        const crypto = global.crypto;

        // Tolerate polyfill already being in place, due to updated dependencies
        const hasCrypto = crypto && !!crypto.getRandomValues;
        if (hasCrypto) return;

        const { getRandomValuesFallback } = await import('../uuid-polyfill.js');
        const { TXMFocusManager } = await import('../../focus_manager/txm_focus_manager.js');

        // Ensure polyfill is in now place.
        assert.strictEqual(crypto && getRandomValuesFallback == crypto.getRandomValues, true);

        const v = uuid();
        assert.strictEqual(isUuid(v), true);

        const fm1 = new TXMFocusManager();
        assert.strictEqual(isUuid(fm1.id), true);

        const fm2 = new TXMFocusManager();
        assert.strictEqual(isUuid(fm2.id), true);

        assert.strictEqual(fm1.id == fm2.id, false);
    });
});
