import {encodeUrlParams} from "../utils/url_params";

/**
 *  Common tracking pixels that need to be shared across platforms, c2, and c3
 */
export class Pixels {
    constructor(observerCallback) {
        this.observerCallback = observerCallback;
    }

    fire(name, url, params, separator = '?') {
        if (params) {
            url = url + separator + encodeUrlParams(params);
        }
        try {
            const pixel = new Image();
            pixel.src = url;
            if (this.observerCallback) this.observerCallback(name, url);
        } catch (err) {}
    }

    fireComscore() {
        this.fire("comscore", "https://sb.scorecardresearch.com/p", {
            c1: 8,
            c2: "8030913",
            c3: 2,
            cj: 1
        });
    }
}