import {
    BaseLoader,
    ImageLoader,
    ScriptLoader,
    IframeLoader,
    StyleLoader,
    TextLoader,
    GetAssetLoader,
} from '../loaders';

describe('BaseLoader Class', () => {
    describe('constructor', () => {
        it('throws an error if a url to load is not defined', () => {
            const willThrow = () => {
                new BaseLoader();
            };
            expect(willThrow).toThrow();
        });

        it('does not throw an error if a url is given', () => {
            const shouldNotThrow = () => {
                new BaseLoader('myurl');
            };
            expect(shouldNotThrow).not.toThrow();
        });
    });

    describe('onload', () => {
        it('saves an onload callback', () => {
            const loader = new BaseLoader('http://google.com/track');
            const onloadCB = jest.fn();
            expect(loader.onload).toBeUndefined();
            loader.onload = onloadCB;
            expect(loader.onload).toBeDefined();
        });
    });

    describe('onerror', () => {
        it('saves an onerror callback', () => {
            const loader = new BaseLoader('http://google.com/track');
            const onerrorCB = jest.fn();
            expect(loader.onerror).toBeUndefined();
            loader.onerror = onerrorCB;
            expect(loader.onerror).toBeDefined();
        });
    });
});

describe('ScriptLoader', () => {
    it('creates a new script element', () => {
        const script = new ScriptLoader('http://myscript.js');
        expect(script.element).toBeDefined();
        expect(script.element.nodeName).toBe('SCRIPT');
    });
});

describe('ImageLoader', () => {
    it('creates a new image element', () => {
        const img = new ImageLoader('myimg.jpeg');
        expect(img.element).toBeDefined();
        expect(img.element.nodeName).toBe('IMG');
    });
});

describe('IframeLoader', () => {
    it('creates a new iframe element', () => {
        const iframe = new IframeLoader('http://google.com');
        expect(iframe.element).toBeDefined();
        expect(iframe.element.nodeName).toBe('IFRAME');
    });
});

describe('StyleLoader', () => {
    it('creates a new script element', () => {
        const style = new StyleLoader('http://google.com/mycss.css');
        expect(style.element).toBeDefined();
        expect(style.element.nodeName).toBe('LINK');
    });
});

describe('GetAssetLoader', () => {
    const origLog = console.log;
    // supress console.log
    beforeEach(() => {
        console.log = jest.fn();
    });
    afterEach(() => {
        console.log = origLog;
    });

    it('returns a script loader if the filename given ends with .js', () => {
        const loader = GetAssetLoader('myscript.js');
        expect(loader instanceof ScriptLoader).toBe(true);
    });

    it('returns an image loader if the filename ends with an png, gif, jpg, svg', () => {
        const extensions = ['gif', 'jpg', 'jpeg', 'png', 'svg'];
        extensions.forEach((ext) => {
            const loader = GetAssetLoader(`myimage.${ext}`);
            expect(loader instanceof ImageLoader).toBe(true);
        });
    });

    it('returns a style loader if the filename ends with css', () => {
        const loader = GetAssetLoader('mycss.css');
        expect(loader instanceof StyleLoader).toBe(true);
    });

    it('returns undefined if the file extension is not known', () => {
        const loader = GetAssetLoader('https://google.com/abc/myvideo.mp4');
        expect(loader).toBeUndefined();
    });

    it('returns a script loader if we pass it a config with type set to "script"', () => {
        const loader = GetAssetLoader({ url: 'myscript', type: 'script' });
        expect(loader instanceof ScriptLoader).toBe(true);
    });

    it('returns a script loader if we pass it a config with type set to "style"', () => {
        const loader = GetAssetLoader({ url: 'mycss', type: 'style' });
        expect(loader instanceof StyleLoader).toBe(true);
    });

    it('returns an image loader if we pass it a config with type set to "image"', () => {
        const loader = GetAssetLoader({
            url: 'http://google.com/my/image',
            type: 'image',
        });
        expect(loader instanceof ImageLoader).toBe(true);
    });

    it('returns a text loader if the filename ends with html', () => {
        const loader = GetAssetLoader('http://google.com/my/page.html');
        expect(loader instanceof TextLoader).toBe(true);
    });

    it('returns a text loader if we pass it a config with type set to "html"', () => {
        const loader = GetAssetLoader({
            url: 'http://google.com/my/page.html',
            type: 'html',
        });
        expect(loader instanceof TextLoader).toBe(true);
    });

    it('returns undefined if an known type is given', () => {
        const loader = GetAssetLoader({
            url: 'http://google.com/my/image',
            type: 'cool',
        });
        expect(loader).toBeUndefined();
    });
});
