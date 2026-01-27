import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert';
import {
    BaseLoader,
    ImageLoader,
    ScriptLoader,
    IframeLoader,
    StyleLoader,
    TextLoader,
    GetAssetLoader,
} from '../loaders.js';
import 'global-jsdom/register';

describe('BaseLoader Class', () => {
    describe('constructor', () => {
        it('throws an error if a url to load is not defined', () => {
            assert.throws(() => {
                new BaseLoader();
            });
        });

        it('does not throw an error if a url is given', () => {
            assert.doesNotThrow(() => {
                new BaseLoader('myurl');
            });
        });
    });

    describe('onload', () => {
        it('saves an onload callback', () => {
            const loader = new BaseLoader('http://google.com/track');
            const onloadCB = mock.fn();
            assert.strictEqual(loader.onload, undefined);
            loader.onload = onloadCB;
            assert.notStrictEqual(loader.onload, undefined);
        });
    });

    describe('onerror', () => {
        it('saves an onerror callback', async () => {
            const loader = new BaseLoader('http://google.com/track');
            const onerrorCB = mock.fn();
            assert.strictEqual(loader.onerror, undefined);
            loader.onerror = onerrorCB;
            assert.notStrictEqual(loader.onerror, undefined);

            const promise = loader.promise;
            const testError = new Error('test error');
            let warning;
            const origWarn = console.warn;
            console.warn = (...args) => {warning = args.join(' ')};
            loader.__reject(testError, 1, 2);

            try {
                await promise;
                // should not get here
                assert.strictEqual(false, true);
            } catch (err) {
                assert.strictEqual(err, testError);
                assert.strictEqual(onerrorCB.mock.callCount(), 1);
                assert.strictEqual(warning, 'rejected http://google.com/track Error: test error 1 2');
            } finally {
                console.warn = origWarn;
            }
        });
    });
});

describe('ScriptLoader', () => {
    it('creates a new script element', () => {
        const script = new ScriptLoader('http://myscript.js');
        assert.notStrictEqual(script.element, undefined);
        assert.strictEqual(script.element.nodeName, 'SCRIPT');
    });
});

describe('ImageLoader', () => {
    it('creates a new image element', () => {
        const img = new ImageLoader('myimg.jpeg');
        assert.notStrictEqual(img.element, undefined);
        assert.strictEqual(img.element.nodeName, 'IMG');
    });
});

describe('IframeLoader', () => {
    it('creates a new iframe element', () => {
        const iframe = new IframeLoader('http://google.com');
        assert.notStrictEqual(iframe.element, undefined);
        assert.strictEqual(iframe.element.nodeName, 'IFRAME');
    });
});

describe('StyleLoader', () => {
    it('creates a new script element', () => {
        const style = new StyleLoader('http://google.com/mycss.css');
        assert.notStrictEqual(style.element, undefined);
        assert.strictEqual(style.element.nodeName, 'LINK');
    });
});

describe('GetAssetLoader', () => {
    let origLog;
    
    beforeEach(() => {
        origLog = console.log;
        console.log = mock.fn();
    });
    
    afterEach(() => {
        console.log = origLog;
    });

    it('returns a script loader if the filename given ends with .js', () => {
        const loader = GetAssetLoader('myscript.js');
        assert.strictEqual(loader instanceof ScriptLoader, true);
    });

    it('returns an image loader if the filename ends with an png, gif, jpg, svg', () => {
        const extensions = ['gif', 'jpg', 'jpeg', 'png', 'svg'];
        extensions.forEach((ext) => {
            const loader = GetAssetLoader(`myimage.${ext}`);
            assert.strictEqual(loader instanceof ImageLoader, true);
        });
    });

    it('returns a style loader if the filename ends with css', () => {
        const loader = GetAssetLoader('mycss.css');
        assert.strictEqual(loader instanceof StyleLoader, true);
    });

    it('returns undefined if the file extension is not known', () => {
        const loader = GetAssetLoader('https://google.com/abc/myvideo.mp4');
        assert.strictEqual(loader, undefined);
    });

    it('returns a script loader if we pass it a config with type set to "script"', () => {
        const loader = GetAssetLoader({ url: 'myscript', type: 'script' });
        assert.strictEqual(loader instanceof ScriptLoader, true);
    });

    it('returns a script loader if we pass it a config with type set to "style"', () => {
        const loader = GetAssetLoader({ url: 'mycss', type: 'style' });
        assert.strictEqual(loader instanceof StyleLoader, true);
    });

    it('returns an image loader if we pass it a config with type set to "image"', () => {
        const loader = GetAssetLoader({
            url: 'http://google.com/my/image',
            type: 'image',
        });
        assert.strictEqual(loader instanceof ImageLoader, true);
    });

    it('returns a text loader if the filename ends with html', () => {
        const loader = GetAssetLoader('http://google.com/my/page.html');
        assert.strictEqual(loader instanceof TextLoader, true);
    });

    it('returns a text loader if we pass it a config with type set to "html"', () => {
        const loader = GetAssetLoader({
            url: 'http://google.com/my/page.html',
            type: 'html',
        });
        assert.strictEqual(loader instanceof TextLoader, true);
    });

    it('returns undefined if an known type is given', () => {
        const loader = GetAssetLoader({
            url: 'http://google.com/my/image',
            type: 'cool',
        });
        assert.strictEqual(loader, undefined);
    });
});
