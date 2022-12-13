export function flattenObject (obj, parent, result = {}, keyPrefix = '[', keySuffix = ']'){
    if (obj && typeof obj == "object") {
        Object.entries(obj).forEach(entry => {
            const key = parent ? parent + keyPrefix + entry[0] + keySuffix : entry[0];
            const value = entry[1];

            if (typeof value == 'object') {
                if (Array.isArray(value)) {
                    // TODO / Ignored for now
                } else {
                    flattenObject(value, key, result);
                }
            } else {
                result[key] = value;
            }
        });
    } else {
        return obj;
    }

    return result;
}