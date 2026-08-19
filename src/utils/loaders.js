import { GetFileExtension } from './get_file_extension.js';
import StripProtocol from './strip_protocol.js';

/**
 * BaseLoader - A generic loader class used to load external assets
 */
export class BaseLoader {
    /**
     * @type {((...data: unknown[]) => void) | undefined}
     */
    _onLoadCB;
    /**
     * @type {((...data: unknown[]) => void) | undefined}
     */
    _onErrorCB;

    /**
     * @param {string} url
     * @param {'http:' | 'https:'} [protocol]
     */
    constructor(url, protocol) {
        if (!url) {
            throw 'url not provided';
        }

        if (!protocol) {
            protocol = window.location.protocol === 'https:'
                ? 'https:'
                : 'http:'
            ;
        }

        this._url = url;
        this._protocol = protocol;
        this.__resolve = this.__resolve.bind(this);
        this.__reject = this.__reject.bind(this);
        this._promise = new Promise((resolve, reject) => {
            /** @type {(...data: unknown[]) => void} */
            this._resolve = resolve;
            /** @type {(...data: unknown[]) => void} */
            this._reject = reject;
        });
    }

    /**
     * @param {...unknown} data
     * @returns {void}
     */
    __resolve(...data) {
        if (this._onLoadCB) {
            this._onLoadCB(...data);
        }
        this._resolve(...data);
    }

    /**
     * @param {...unknown} data
     * @returns {void}
     */
    __reject(...data) {
        console.warn('rejected', this._url, ...data);
        if (this._onErrorCB) {
            this._onErrorCB(...data);
        }
        this._reject(...data);
    }

    get promise() {
        return this._promise;
    }

    /**
     * @returns {((...data: unknown[]) => void) | undefined}
     */
    get onload() {
        return this._onLoadCB;
    }

    /**
     * @returns {((...data: unknown[]) => void) | undefined}
     */
    get onerror() {
        return this._onErrorCB;
    }

    /**
     * @param {((...data: unknown[]) => void) | undefined} cb
     */
    set onload(cb) {
        this._onLoadCB = cb;
    }

    /**
     * @param {((...data: unknown[]) => void) | undefined} cb
     */
    set onerror(cb) {
        this._onErrorCB = cb;
    }
}

/**
 * ScriptLoader - Loads a specified script
 */
export class ScriptLoader extends BaseLoader {
    /**
     * @param {string} url
     * @param {'http:' | 'https:'} [protocol]
     */
    constructor(url, protocol) {
        super(url, protocol);
        this._scriptEl = document.createElement('script');
    }

    get element() {
        return this._scriptEl;
    }

    // Can't unit test the load function, so we are ignoring in the coverage test
    /* istanbul ignore next */
    load() {
        const scriptEl = this._scriptEl;
        const head = /** @type {HTMLHeadElement} */ (document.querySelector('head'));
        const scriptURL = this._protocol + StripProtocol(this._url);
        head.appendChild(scriptEl);
        scriptEl.onload = this.__resolve;
        scriptEl.onerror = this.__reject;

        // if (this._onLoadCB) {
        //     scriptEl.onload = this._onLoadCB;
        // }
        // if (this._onErrorCB) {
        //     scriptEl.onerror = this._onErrorCB;
        // }

        scriptEl.src = scriptURL;
    }
}

/**
 * ImageLoader - Loads urls using the image tag
 */
export class ImageLoader extends BaseLoader {
    /**
     * @param {string} url
     * @param {'http:' | 'https:'} [protocol]
     */
    constructor(url, protocol) {
        super(url, protocol);
        this._imgEl = new Image();
    }

    get element() {
        return this._imgEl;
    }

    // Can't unit test the load function, so we are ignoring in the coverage test
    /* istanbul ignore next */
    load() {
        const img = this._imgEl;
        img.onload = this.__resolve;
        img.onerror = this.__reject;

        // if (this._onLoadCB) {
        //     img.onload = this._onLoadCB;
        // }
        // if (this._onErrorCB) {
        //     img.onerror = this._onErrorCB;
        // }
        img.src = this._url;
    }
}

/**
 * IframeLoader - Loads urls into an invisible iframe
 */
export class IframeLoader extends BaseLoader {
    /**
     * @type {HTMLIFrameElement}
     */
    _iframe;

    /**
     * @param {string} url
     * @param {'http:' | 'https:'} [protocol]
     */
    constructor(url, protocol) {
        super(url, protocol);
        this._iframe = document.createElement('iframe');
        this._iframe.width = '1';
        this._iframe.height = '1';
        this._iframe.style.zIndex = '-1';
        this._iframe.style.position = 'absolute';
        this._iframe.style.left = '-99999px';
    }

    get element() {
        return this._iframe;
    }

    /* istanbul ignore next */
    load() {
        document.body.appendChild(this._iframe);
        this._iframe.src = this._url;
    }
}

export class StyleLoader extends BaseLoader {
    /**
     * @param {string} url
     * @param {'http:' | 'https:'} [protocol]
     */
    constructor(url, protocol) {
        super(url, protocol);
        this._linkEl = document.createElement('link');
        this._linkEl.rel = 'stylesheet';
        this._linkEl.type = 'text/css';
    }

    get element() {
        return this._linkEl;
    }

    // Can't unit test the load function, so we are ignoring in the coverage test
    /* istanbul ignore next */
    load() {
        const linkEl = this._linkEl;
        const head = /** @type {HTMLHeadElement} */ (document.querySelector('head'));
        const cssURL = this._protocol + StripProtocol(this._url);
        head.appendChild(linkEl);

        linkEl.onload = this.__resolve;
        linkEl.onerror = this.__reject;

        // if (this._onLoadCB) {
        //     linkEl.onload = this._onLoadCB;
        // }
        // if (this._onErrorCB) {
        //     linkEl.onerror = this._onErrorCB;
        // }
        linkEl.href = cssURL;
    }
}

export class TextLoader extends BaseLoader {
    // just to fulfill the interface.
    get element() {
        return document.createElement('template');
    }

    load() {
        fetch(this._url, {
            credentials: 'omit',
            headers: {},
            method: 'GET',
            mode: 'cors',
        })
            .then((resp) => {
                return resp.text();
            })
            .then((text) => {
                this.__resolve(text);
            })
            .catch((e) => {
                this.__reject(e);
            });
    }
}

/**
 * @typedef {{ url: string, type: string }} AssetDescriptor
 */

/**
 * @param {string | AssetDescriptor} asset
 * @returns {BaseLoader | undefined}
 */
export function GetAssetLoader(asset) {
    /** @type {string | undefined} */
    let url = undefined;
    /** @type {string| undefined} */
    let condition;
    /** @type {BaseLoader | undefined} */
    let loader;

    if (typeof asset === 'string') {
        url = asset;
        condition = GetFileExtension(asset).toLowerCase();
    }

    if (typeof asset === 'object' && asset.url && asset.type) {
        url = asset.url;
        condition = asset.type;
    }

    if (!url || !condition) {
        return;
    }

    switch (condition) {
        case 'js':
        case 'script':
            loader = new ScriptLoader(url);
            break;
        case 'css':
        case 'style':
            loader = new StyleLoader(url);
            break;
        case 'png':
        case 'gif':
        case 'jpg':
        case 'jpeg':
        case 'svg':
        case 'image':
            loader = new ImageLoader(url);
            break;
        case 'html':
            loader = new TextLoader(url);
            break;
        default:
            console.log('¯_(ツ)_/¯');
    }
    return loader;
}
