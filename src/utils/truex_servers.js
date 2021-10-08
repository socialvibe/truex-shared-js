
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
    constructor(vastConfigOrUrl) {
        var isProd = false; // by default

        var firstAd;
        if (typeof vastConfigOrUrl == 'string') {
            isProd = isTruexProductionUrl(vastConfigOrUrl);

        } else {
            firstAd = vastConfigOrUrl && vastConfigOrUrl.ads && vastConfigOrUrl.ads[0];
            if (firstAd) {
                isProd = isTruexProductionUrl(firstAd.window_url);
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
            if (!isProd && !host.startsWith(qaPrefix) && host.indexOf('truex.com') >= 0) {
                result = qaPrefix + host;
            }
            if (!result.startsWith('http')) {
                result = 'https://' + result;
            }
            return result;
        }
    }
}