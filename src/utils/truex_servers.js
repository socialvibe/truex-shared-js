
/**
 * @param {string | undefined} [url]
 * @returns {boolean}
 */
export function isTruexProductionUrl(url) {
    if (url) {
        const m = url.match(/^(https?:\/\/)?([a-zA-Z0-9\-_]+).truex.com/);
        if (m) {
            return !m[2].startsWith('qa-');
        }
    }
    return false;
}

/**
 * Describes various qa vs production versions of some key truex backend servers
 */
export class TruexServers {
    /**
     * @param {boolean | string | Record<string, unknown>} [vastConfigOrUrlOrFlag]
     *   `true`/`false` for prod vs qa, a URL to inspect, or a VAST config object
     */
    constructor(vastConfigOrUrlOrFlag) {
        this.env = this._resolveEnvironment(vastConfigOrUrlOrFlag);
        this.isProduction = this.env === 'prod';

        const prefix = this.isProduction ? '' : 'qa-';

        this.rtbServerUrl     = `https://${prefix}qa.truex.com`;
        this.engageServerUrl  = `https://${prefix}engage.truex.com`;
        this.mediaServerUrl   = `https://${prefix}media.truex.com`;
        this.measureServerUrl = `https://${prefix}measure.truex.com`;
        this.qrCodeServerUrl  = `https://${prefix}qr.truex.com`;
        this.eeServerUrl      = `https://${prefix}ee.truex.com`;

        /**
         * @deprecated use {@link TruexServers#engageServerUrl} instead.
         * "serve.truex.com" is now just a redirect to it.
         */
        this.truexServerUrl   = `https://${prefix}serve.truex.com`;
    }

    /**
     * @param {boolean | string | Record<string, unknown>} [vastConfigOrUrlOrFlag]
     * @returns { 'qa' | 'prod' }
     */
    _resolveEnvironment(vastConfigOrUrlOrFlag) {
        let isProd = false;

        if (typeof vastConfigOrUrlOrFlag === 'boolean') {
            isProd = vastConfigOrUrlOrFlag === true;
        } else if (typeof vastConfigOrUrlOrFlag === 'string') {
            isProd = isTruexProductionUrl(vastConfigOrUrlOrFlag);
        } else if (vastConfigOrUrlOrFlag) {
            const vc = /** @type {VastConfigLike} */ (vastConfigOrUrlOrFlag);
            const firstAd = vc && vc.ads && vc.ads[0];
            // The adserver generates window_url and service_url for the same environment.
            // card_creative_url is free-form placement data, so it is not authoritative here.
            isProd = isTruexProductionUrl(firstAd && firstAd.window_url || vc.service_url);
        }

        return isProd ? 'prod' : 'qa';
    }
}

/**
 * @typedef {{
 *   service_url: string,
 *   ads: {
 *      window_url: string,
 *      service_url: string,
 *   }[]
 * }} VastConfigLike
 */
