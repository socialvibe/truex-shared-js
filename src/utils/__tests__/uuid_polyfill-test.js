import { getRandomValues as polyFill_getRandomValues } from '../uuid-polyfill';
import { TXMFocusManager } from '../../focus_manager/txm_focus_manager';
import { uuid, isUuid } from 'uuidv4';

test('uuid_polyfill-test', () => {
    const fm1 = new TXMFocusManager();
    expect(isUuid(fm1.id)).toBe(true);

    // Ensure polyfill is in place.
    const oldCrypto = global.crypto;
    if (!oldCrypto || oldCrypto.getRandomValues !== polyFill_getRandomValues) {
        global.crypto = {
            getRandomValues: polyFill_getRandomValues
        }
    }
    expect(polyFill_getRandomValues == crypto.getRandomValues).toBe(true);

    const v = uuid();
    expect(isUuid(v)).toBe(true);

    const fm2 = new TXMFocusManager();
    expect(isUuid(fm1.id)).toBe(true);
});