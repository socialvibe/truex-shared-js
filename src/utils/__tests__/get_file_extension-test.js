import { GetFileExtension } from '../get_file_extension';

describe('GetFileExtension', () => {
    it('throws when a filename is not provided', () => {
        const shouldThrow = () => {
            GetFileExtension();
        };
        expect(shouldThrow).toThrow();
    });

    it('throws if the filename given is not a string', () => {
        const shouldThrow = () => {
            GetFileExtension({});
        };
        expect(shouldThrow).toThrow();
    });

    it('returns the file extension', () => {
        expect(GetFileExtension('foo.js')).toBe('js');
    });
});
