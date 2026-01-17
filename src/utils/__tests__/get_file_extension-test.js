import { describe, it } from 'node:test';
import assert from 'node:assert';
import { GetFileExtension } from '../get_file_extension.js';

describe('GetFileExtension', () => {
    it('throws when a filename is not provided', () => {
        assert.throws(() => {
            GetFileExtension();
        });
    });

    it('throws if the filename given is not a string', () => {
        assert.throws(() => {
            GetFileExtension({});
        });
    });

    it('returns the file extension', () => {
        assert.strictEqual(GetFileExtension('foo.js'), 'js');
    });
});
