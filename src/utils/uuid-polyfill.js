
// Helper polyfill to ensure uuid/uuidv4 modules can run even
// when crypto.getRandomValues() is not present

// Backup implementation lifted from:
// https://github.com/LinusU/react-native-get-random-values/blob/master/index.js

let warned = false
function insecureRandomValues (array) {
    if (!warned) {
        console.warn("Using an insecure random number generator, this should only happen during unit tests"
            + "\non Jenkins that is missing support for crypto.getRandomValues");
        warned = true
    }

    for (let i = 0, r; i < array.length; i++) {
        if ((i & 0x03) === 0) r = Math.random() * 0x100000000
        array[i] = (r >>> ((i & 0x03) << 3)) & 0xff
    }

    return array
}

/**
 * @param {Int8Array|Uint8Array|Int16Array|Uint16Array|Int32Array|Uint32Array|Uint8ClampedArray} array
 */
function getRandomValues (array) {
    if (!(array instanceof Int8Array || array instanceof Uint8Array || array instanceof Int16Array
        || array instanceof Uint16Array || array instanceof Int32Array || array instanceof Uint32Array
        || array instanceof Uint8ClampedArray)) {
        throw new TypeMismatchError('Expected an integer array')
    }

    if (array.byteLength > 65536) {
        throw new QuotaExceededError('Can only request a maximum of 65536 bytes')
    }

    return insecureRandomValues(array)
}

if (typeof global.crypto !== 'object') {
    global.crypto = {}
}

if (typeof global.crypto.getRandomValues !== 'function') {
    global.crypto.getRandomValues = getRandomValues
}

export { getRandomValues };
