
class DMPSegements {
  constructor(placement_hash, network_user_id, server_url) {
        this._placementHash = placement_hash;
        this._networkUserId = network_user_id;
        this._serverUrl = server_url || 'serve.truex.com';

        this._quantcastLoaded = false;
        this._exelateLoaded = false;
        this._segmentsTimedOut = false;
        this._callback = null;

        this._quantcastSegments = null;
        this._exelateSegments = null;
    }

    loadSegments(callback) {
        this._callback = callback;

        this.loadQuantcastTag(() => {
            if (this._segmentsTimedOut) {
                this._updateUserSegments('quantcast', this.quantcastSegments());
                return;
            }

            this._quantcastLoaded = true;

            if (this._quantcastLoaded && this._exelateLoaded) {
                this._callback();
            }
        });

        this.loadExelateTag(() => {
            if (this._segmentsTimedOut) {
                this._updateUserSegments('exelate', this.exelateSegments());
                return;
            }

            this._exelateLoaded = true;

            if (this._quantcastLoaded && this._exelateLoaded) {
                this._callback();
            }
        });

        this.loadBlueKaiTag();

        setTimeout(this._onSegmentDataTimeout.bind(this), 300);
    }

    quantcastSegments() {
        return this._quantcastSegments;
    }

    exelateSegments() {
        return this._exelateSegments;
    }

    _onSegmentDataTimeout() {
        if (this._quantcastLoaded && this._exelateLoaded) {
            return;
        }

        this._segmentsTimedOut = true;
        this._callback();
    }

    _updateUserSegments(dmpName, segments) {
        if (segments && segments.length > 0) {

            var xhr = new XMLHttpRequest();
            xhr.open('POST', this._getLocationProtocol() + '//' + this._serverUrl.replace('serve', 'get') + '/placements/' + this._placementHash + '/users/' + this._networkUserId, true);
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
            xhr.send(dmpName + '_segment_ids=' + segments.join(','));
        }
    }

    _createScript(url) {
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.async = true;
        script.src = url;
        document.getElementsByTagName('head')[0].appendChild(script);
    }

    _getLocationProtocol() {
        // default to https:
        var protocol = 'https:';

        try {
            protocol = window.location.protocol || document.location.protocol;
            if (protocol !== 'http:') {
                protocol = 'https:';
            }
        } catch (err) {}

        return protocol;
    }

    loadQuantcastTag(callback) {
        var tagCallbackName = 'truex_qc_callback';

        window[tagCallbackName] = (result) => {
            this._quantcastSegments = [];
            for (var i = 0; i < result.segments.length; i++) {
                this._quantcastSegments.push(result.segments[i].id);
            }

            callback();
        };

        this._createScript('//pixel.quantserve.com/api/segments.json?a=p-EzVU5HfAMVqEV&ttl=86400&callback=' + tagCallbackName);
    }


    loadExelateTag(callback) {
        // new eXelate tag
        //this._createScript('//loadus.exelator.com/load/?p=204&g=87&buid=' + this._networkUserId);

        // id regexes
        var MOBILE_ADVERTISING_ID_REGEX = /^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-4[0-9A-Fa-f]{3}-[89abAB]{1}[0-9A-Fa-f]{3}-[0-9A-Fa-f]{12}$/;

        // helper functions specifically for Exelate Mobile
        var isiOS = function() {
            return /iPhone|iPad|iPod|iOS/.test(navigator.userAgent);
        };

        var isAndroid = function() {
            return /Android/.test(navigator.userAgent);
        };

        var looksLikeMobileAdvertiserId = function(userId) {
            return MOBILE_ADVERTISING_ID_REGEX.test(userId);
        };

        var baseTagUrl = '//load.exelator.com/load/?p=104&g=700&j=j&t_cb=';
        var tagCallbackName = 'truex_exelate_callback';

        if (isAndroid() && looksLikeMobileAdvertiserId(this._networkUserId)) {
            baseTagUrl = '//loadus.exelator.com/load?p=104&g=701&xl8Id=' + this._networkUserId + '&idtype=AAID&APP=1&j=j&t_cb=';
        } else if (isiOS() && looksLikeMobileAdvertiserId(this._networkUserId)) {
            baseTagUrl = '//loadus.exelator.com/load?p=104&g=701&xl8Id=' + this._networkUserId.toLowerCase() + '&idtype=IDFA&APP=1&j=j&t_cb=';
        }

        window[tagCallbackName] = (result) => {
            this._exelateSegments = [];
            if (result && result.segments && result.segments.length) {
                this._exelateSegments = result.segments.slice();
            }

            callback();
        };

        this._createScript(baseTagUrl + tagCallbackName);
    }

    loadBlueKaiTag() {
        var pixel = new Image();
        pixel.src = this._getLocationProtocol() + "//tags.bluekai.com/site/28311?id=" + this._networkUserId + "%3A" + this._placementHash;
    }

    loadNeustarTag(partnerId) {
        var pixel = new Image();
        pixel.src = this._getLocationProtocol() + "//aa.agkn.com/adscores/g.pixel?sid=9212300858&puid=" + partnerId + "-" + this._networkUserId;
    }

    loadAudienceManagerTag(partnerId) {
        var pixel = new Image();
        pixel.src = this._getLocationProtocol() + "//dpm.demdex.net/ibs:dpid=66013&dpuuid=" + partnerId + "-" + this._networkUserId;
    }

    loadLiverampTag(partnerId) {
        var pixel = new Image();
        pixel.src = "https://idsync.rlcdn.com/466426.gif?partner_uid=" + partnerId + "-" + this._networkUserId;
    }

    // fired for all 'fillable' impressions.  PQR = Possible Qualified Request
    loadNielsenDAR(placementHash, dimension1) {
        var pixel = new Image();
        pixel.src = "https://secure-gl.imrworldwide.com/cgi-bin/m?ca=nlsn273685&cr=creative&ce=truex&pc=" + placementHash + "_" + (dimension1 || "") + "&ci=nlsnci799&am=4&at=view&rt=banner&st=image&r=" + (new Date()).getTime();
    }

    loadTapaddPixel(partnerId) {
      var pixel = new Image();
          pixel.src = "https://pixel.tapad.com/idsync/ex/receive?partner_id=3296&partner_device_id=" + partnerId + "-" + this._networkUserId;
    }
}

export default DMPSegements;
