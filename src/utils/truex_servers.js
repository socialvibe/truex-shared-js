
export function isTruexProductionUrl(url) {
    if (url) {
        const m = url.match(/^(https?:\/\/)?([a-z])+.truex.com/);
        if (m) {
            if (m[2].startsWith('qa-')) return false;
            return true;
        }
    }
    return false;
}

/**
 * Describes various qa vs production versions of some key truex backend servers
 */
export class TruexServers {
    constructor(vastConfigOrUrlOrFlag) {
        var isProd = false; // by default

        if (vastConfigOrUrlOrFlag === true) {
            isProd = true;

        } else if (typeof vastConfigOrUrlOrFlag == 'string') {
            isProd = isTruexProductionUrl(vastConfigOrUrlOrFlag);

        } else {
            const vc = vastConfigOrUrlOrFlag;
            const firstAd = vc && vc.ads && vc.ads[0];
            if (firstAd) {
                isProd = isTruexProductionUrl(firstAd.window_url);
            } else {
                isProd = isTruexProductionUrl(vc.card_creative_url || vc.service_url);
            }
        }

        this.isProduction = isProd;

        this.truexServerUrl = serverUrlOf('serve.truex.com');
        this.mediaServerUrl = serverUrlOf('media.truex.com');
        this.measureServerUrl = serverUrlOf('measure.truex.com');

        this.serverUrlOf = serverUrlOf;

        function serverUrlOf(host) {
            var result = host;
            const qaPrefix = 'qa-';
            const hasProtocol = host.match(/^[a-zA-Z]+:\/\//);
            const hasImplicitProtocol = host.match(/^\/\//);
            if (!isProd && !hasProtocol && !hasImplicitProtocol
                && !host.startsWith(qaPrefix) && host.indexOf('truex.com') >= 0) {
                result = qaPrefix + host;
            }
            if (!hasProtocol) {
                if (!hasImplicitProtocol) {
                    result = '//' + result;
                }
                result = 'https:' + result;
            }
            return result;
        }
    }
}