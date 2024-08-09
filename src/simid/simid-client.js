import { v4 as uuid } from 'uuid';

/**
 * Provides an implementation of the Secure Interactive Media Interface Definition (SIMID) for use in
 * any web page loaded in the iframe created for the VAST <InteractiveCreativeFile> element.
 *
 * That is, provides the iframe client implementation of the SIMID message protocol, assuming the existence of the SIMID
 * Player with a currently playing ad video (as specified by the associated VAST <MediaFile> element). The SIMID Player is then the
 * producer of the SIMID messages.
 *
 * @see https://interactiveadvertisingbureau.github.io/SIMID
 */
export class SIMIDClient {
    isActive;
    debug;

    /**
     * Will listen to SIMID player messages posted to the specified window, will post SIMID creative messages to
     * the window's parent.
     * @param {Window} contentWindow
     */
    constructor(contentWindow = window) {
        this._contentWindow = contentWindow;
        this._playerWindow = contentWindow.parent;
        this._pendingClientRequests = {};
        this._nextMessageId = 0;
        this._sessionId = undefined;
        this.isActive = false;
        this.debug = false;
        this._onPlayerMessage = this._onPlayerMessage.bind(this);
    }

    start() {
        if (this.isActive) return;
        this.isActive = true;
        this._contentWindow.addEventListener('message', this._onPlayerMessage);
        this._nextMessageId = 0;
        this._sessionId = uuid();
        this._playerConfig = undefined;
        this._pendingClientRequests = {};
        return this._sendClientRequest('createSession', {});
    }

    stop() {
        if (!this.isActive) return;
        this.isActive = false;
        this._contentWindow.removeEventListener('message', this._onPlayerMessage);
        this._pendingClientRequests = {};
    }

    /**
     * @param {string|Error} errorOrMessage
     * @return {string}
     */
    getErrorMessage(errorOrMessage) {
        // Keep the class name for error subclasses
        const errMessage = (errorOrMessage instanceof Error)
            ? (errorOrMessage.constructor == Error) ? errorOrMessage.message : errorOrMessage.toString()
            : '' + errorOrMessage;
        return errMessage;
    }

    fatalError(errorCode, errorOrMessage) {
        const message = this.getErrorMessage(errorOrMessage);
        console.error(`SIMID fatal client error: ${errorCode} - ${message}`);
        this._sendClientMessage('SIMID:Creative:fatalError', {errorCode, message});
        this.stop();
        this.onFatalError(errorCode, message); // in case any completion is needed
    }

    getMediaState() {
        return this._sendClientRequest('SIMID:Creative:getMediaState')
            .then(response => {
                return new SIMIDMediaState(response);
            });
    }

    clickThru({ x, y, uri }) {
        const playerHandles = this._playerConfig?.navigationSupport == 'playerHandles';
        return this._sendClientRequest('SIMID:Creative:clickThru', {x, y, playerHandles, uri });
    }

    log(message) {
        this._sendClientMessage('SIMID:Creative:log', {message});
    }

    /**
     * @param {string[]} trackingUrls
     * @return {Promise<unknown>}
     */
    reportTracking(trackingUrls) {
        return this._sendClientRequest('SIMID:Creative:reportTracking', {trackingUrls});
    }

    /**
     * @param {Number} duration use -2 to indicate an unknown duration
     * @return {Promise<unknown>}
     */
    requestChangeAdDuration(duration) {
        const variableDurationAllowed = this._playerConfig?.variableDurationAllowed;
        if (!variableDurationAllowed) {
            return Promise.reject(this._newClientError(SIMIDErrors.unspecifiedClientError,
                'requestChangeAdDuration not allowed when variableDurationAllowed is false'));
        }
        return this._sendClientRequest('SIMID:Creative:requestChangeAdDuration', { duration });
    }

    /**
     * @param {Number} volume from 0...1, inclusive
     * @param {boolean} muted
     * @return {Promise<unknown>}
     */
    requestChangeVolume({ volume, muted }) {
        return this._sendClientRequest('SIMID:Creative:requestChangeVolume', {volume, muted});
    }

    /**
     * @return {Promise<unknown>}
     */
    requestFullscreen() {
        const fullscreenAllowed = this._playerConfig?.fullscreenAllowed;
        if (!fullscreenAllowed) {
            return Promise.reject(this._newClientError(SIMIDErrors.unspecifiedClientError,
                'requestFullscreen not allowed when fullscreenAllowed is false'));
        }
        return this._sendClientRequest('SIMID:Creative:requestFullscreen');
    }

    /**
     * @return {Promise<unknown>}
     */
    requestExitFullscreen() {
        const fullscreenAllowed = this._playerConfig?.fullscreenAllowed;
        if (!fullscreenAllowed) {
            return Promise.reject(this._newClientError(SIMIDErrors.unspecifiedClientError,
                'requestExitFullscreen not allowed when fullscreenAllowed is false'));
        }
        return this._sendClientRequest('SIMID:Creative:requestExitFullscreen');
    }

    /**
     * @param {string} uri
     * @return {Promise<unknown>}
     */
    requestNavigation(uri) {
        return this._sendClientRequest('SIMID:Creative:requestNavigation', { uri });
    }

    /**
     * @return {Promise<unknown>}
     */
    requestPause() {
        const canPause = this._playerConfig?.variableDurationAllowed;
        if (!canPause) {
            return Promise.reject(this._newClientError(SIMIDErrors.unspecifiedClientError,
                'requestPause not allowed when variableDurationAllowed is false'));
        }
        return this._sendClientRequest('SIMID:Creative:requestPause');
    }

    /**
     * @return {Promise<unknown>}
     */
    requestPlay() {
        const canPlay = this._playerConfig?.variableDurationAllowed;
        if (!canPlay) {
            return Promise.reject(this._newClientError(SIMIDErrors.unspecifiedClientError,
                'requestPlay not allowed when variableDurationAllowed is false'));
        }
        return this._sendClientRequest('SIMID:Creative:requestPlay');
    }

    /**
     * @param {{x, y, width, height }} mediaDimensions
     * @param {{x, y, width, height }} creativeDimensions
     * @return {Promise<unknown>}
     */
    requestResize({ mediaDimensions, creativeDimensions }) {
        return this._sendClientRequest('SIMID:Creative:requestResize', { mediaDimensions, creativeDimensions });
    }

    /**
     * @return {Promise<unknown>}
     */
    requestSkip() {
        return this._sendClientRequest('SIMID:Creative:requestSkip');
    }

    /**
     * @return {Promise<unknown>}
     */
    requestStop() {
        return this._sendClientRequest('SIMID:Creative:requestStop');
    }

    _onPlayerMessage(event) {
        // Ignore non-SIMID messages, or those for other clients.
        if (!this.isActive) return;
        const data = event.data;
        if (!data) return;
        const {sessionId, messageId, type, args} = data;
        if (!sessionId || isNaN(messageId) || !type) return;
        if (sessionId != this._sessionId) return;

        const isLogMsg = type == 'SIMID:Player:log';
        const isErrMsg = type == 'SIMID:Player:fatalError';

        this._logMessage('player message', data);

        // Handle responses first.
        switch (type) {
            case 'resolve':
                this._resolveClientMessage(args?.messageId, args?.value);
                return;

            case 'reject':
                this._rejectClientMessage(args?.messageId, args?.value?.errorCode, args?.value?.message);
                return;
        }

        // Handle media events
        if (type.startsWith('SIMID:Media:')) {
            this._mediaEvent(messageId, type, args);
            return;
        }

        try {
            // Handle requests.
            switch (type) {
                case 'SIMID:Player:init':
                    this._init(messageId, type, args);
                    break;

                case 'SIMID:Player:startCreative':
                    this._startCreative(messageId, type);
                    break;

                case 'SIMID:Player:log':
                    this._playerLog(args);
                    break;

                case 'SIMID:Player:resize':
                    this._resize(args);
                    break;

                case 'SIMID:Player:adSkipped':
                    this._adSkipped(messageId, type);
                    break;

                case 'SIMID:Player:adStopped':
                    this._adStopped(messageId, type);
                    break;

                case 'SIMID:Player:adBackgrounded':
                    this._adBackgrounded(messageId, type);
                    break;

                case 'SIMID:Player:adForegrounded':
                    this._adForegrounded(messageId, type);
                    break;

                case 'SIMID:Player:collapseNonLinear':
                    // Not supported
                    break;

                case 'SIMID:Player:fatalError':
                    this._playerFatalError(args);
                    break;
            }
        } catch (error) {
            this._rejectPlayerRequest(messageId, type, SIMIDErrors.adInternalError, error);
        }
    }

    /**
     * Sends a message to the SIMID player, without waiting for a response.
     * @param {string} type
     * @param {any} args
     * @private
     */
    _sendClientMessage(type, args) {
        if (!this.isActive) return;
        const message = this._createMessage(type, args);
        this._logMessage('client message', message);
        this._playerWindow.postMessage(message, '*');
    }

    /**
     * Sends a message to the SIMID player, but waits for a response.
     * @param {string} type
     * @param {any} args
     * @return {Promise<unknown>}
     * @private
     */
    _sendClientRequest(type, args) {
        if (!this.isActive) return;

        const message = this._createMessage(type, args);
        this._logMessage('client request', message);

        const promise = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                const timeoutMsg = "message response timeout";
                this._rejectClientMessage(message.id, SIMIDErrors.unspecifiedClientError, timeoutMsg);
            }, 5000);

            this._pendingClientRequests[message.messageId] = { message, resolve, reject, timeout };

            this._playerWindow.postMessage(message, '*');
        });
        return promise;
    }

    _newClientError(errorCode, message) {
        const error = new Error(message);
        error.errorCode = errorCode;
        return error;
    }

    _createMessage(type, args) {
        const messageId = this._nextMessageId;
        this._nextMessageId += 1;
        return new SIMIDMessage(this._sessionId, messageId, type, args);
    }

    _logMessage(prefix, msg) {
        if (!this.debug) return;

        // ignore messages that already log themselves, or else cause too much noise.
        const isLogMsg = msg.type.endsWith(':log');
        const isErrMsg = msg.type.endsWith(':fatalError');
        const isMediaEvent = msg.type.startsWith('SIMID:Media:');
        const isRejectMsg = msg.type == 'reject';
        const isResolveMsg = msg.type == 'resolve';
        if (isLogMsg || isErrMsg || isMediaEvent || isRejectMsg || isResolveMsg) return;

        let logMsg = `SIMID ${prefix} ${msg.messageId} ${msg.type}`;
        if (msg.args) logMsg += ': ' + JSON.stringify(msg.args);
        console.log(logMsg);
    }

    _resolveClientMessage(messageId, value) {
        const clientRequest = this._pendingClientRequests[messageId];
        if (!clientRequest) return;

        this._completeClientRequest(messageId);
        clientRequest.resolve(value);
    }

    _rejectClientMessage(messageId, errorCode, errMessage) {
        const clientRequest = this._pendingClientRequests[messageId];
        if (!clientRequest) return;

        const msg = clientRequest.message;
        console.error(`SIMID reject client message ${msg.messageId} ${msg.type}: ${errorCode} - ${errMessage}`);

        this._completeClientRequest(messageId);

        const error = new Error(errMessage);
        error.errorCode = errorCode;
        error.clientRequest = msg;
        clientRequest.reject(error);
    }

    _completeClientRequest(messageId) {
        const clientRequest = this._pendingClientRequests[messageId];
        if (!clientRequest) return;

        delete this._pendingClientRequests[messageId];
        if (clientRequest.timeout) {
            clearTimeout(clientRequest.timeout);
            clientRequest.timeout = null;
        }
    }

    _playerResponse(requestId, requestType, clientAction, postResponseAction) {
        let response;
        try {
            response = clientAction();
            if (response instanceof Promise) {
                return response
                    .then(result => {
                        this._resolvePlayerRequest(requestId, result);
                        if (postResponseAction) postResponseAction();
                        return result;
                    })
                    .catch(err => {
                        return this._rejectPlayerRequest(requestId, requestType, SIMIDErrors.adInternalError, err);
                    });
            } else {
                this._resolvePlayerRequest(requestId, response);
                if (postResponseAction) postResponseAction();
            }
        } catch (error) {
            this._rejectPlayerRequest(requestId, requestType, SIMIDErrors.adInternalError, error);
        }
    }

    _resolvePlayerRequest(requestId, value) {
        this._sendClientMessage('resolve', { messageId: requestId, value });
    }

    _rejectPlayerRequest(requestId, requestType, errorCode, errorOrMessage) {
        // Keep the class name for error subclasses/
        const errMessage = this.getErrorMessage(errorOrMessage);
        console.error(`SIMID reject player request ${requestId} ${requestType}: ${errorCode} - ${errMessage}`);

        this._sendClientMessage('reject', { messageId: requestId, value: { errorCode, message: errMessage } });
    }

    _init(requestId, requestType, args) {
        this._playerConfig = new SIMIDPlayerConfig(args);
        return this._playerResponse(requestId, requestType, () => this.onInit(this._playerConfig));
    }

    _startCreative(requestId, requestType) {
        return this._playerResponse(requestId, requestType, () => this.onStartCreative());
    }

    _playerLog(args) {
        const message = args?.message;
        if (!message) return;
        this.onPlayerLog(message);
        return message;
    }

    _resize(args) {
        const videoDimensions = new SIMIDDimensions(args?.videoDimensions);
        const creativeDimensions = new SIMIDDimensions(args?.creativeDimensions);
        const fullscreen = !!args?.fullscreen;
        this.onResize({ videoDimensions, creativeDimensions, fullscreen });
    }

    _adSkipped(requestId, requestType) {
        // Stop only after the final message is sent.
        this._playerResponse(requestId, requestType, () => this.onAdSkipped(), () => this.stop());
    }

    _adStopped(requestId, requestType) {
        // Stop only after the final message is sent.
        this._playerResponse(requestId, requestType, () => this.onAdStopped(), () => this.stop());
    }

    _adBackgrounded(requestId, requestType) {
        return this._playerResponse(requestId, requestType, () => this.onAdBackgrounded());
    }

    _adForegrounded(requestId, requestType) {
        // No promise response is sent.
        this.onAdForegrounded();
    }

    _playerFatalError(args) {
        const errorCode = args?.errorCode;
        const message = this.getErrorMessage(args?.message);
        console.error(`SIMID fatal player error: ${errorCode} - ${message}`);
        this.stop();
        this.onFatalError(errorCode, message); // in case any completion is needed
    }

    _mediaEvent(messageId, type, args) {
        try {
            const event = type.split(':')[2];
            this.onMediaEvent(event, args);
        } catch (error) {
            const message = this.getErrorMessage(args?.message);
            console.error(`SIMID error for media event: ${messageId} - ${type}: ${message}`);
        }
    }

    // Request event handlers: override as needed.

    /**
     * @param {SIMIDPlayerConfig} playerConfig
     * @return {Promise} Should return a promise that completes when client initialization is done.
     */
    onInit(playerConfig) {
    }

    /**
     * Should not need to do anything by default, since page should in theory be already loading due to player init.
     * @return {Promise} Should return a promise that completes when start flow is complete.
     */
    onStartCreative() {
    }

    onPlayerLog(message) {
        console.log('SIMID Player log: ' + message);
    }

    /**
     * Should not need to do anything by default, since iframe window resizes should already be handled in practice.
     * @param {SIMIDDimensions} videoDimensions
     * @param {SIMIDDimensions} creativeDimensions
     * @param {boolean} fullscreen
     */
    onResize({ videoDimension, creativeDimensions, fullscreen }) {
    }

    onMediaEvent(event, args) {
    }

    onAdSkipped() {
    }

    onAdStopped() {
    }

    /**
     * @return {Promise} Should return a promise that completes when ad pause is complete.
     */
    onAdBackgrounded() {
    }

    onAdForegrounded() {
    }

    onFatalError(errorCode, message) {
    }
}

export const SIMIDErrors = {
    unspecifiedClientError: 1100,
    adInternalError: 1108,
    unspecifiedPlayerError: 1200,
}

export class SIMIDMessage {
    sessionId;
    messageId;
    timestamp;
    type;
    args;

    constructor(sessionId, messageId, type, args) {
        this.sessionId = sessionId;
        this.messageId = messageId;
        this.timestamp = Date.now();
        this.type = type;
        this.args = args;
    }
}

export class SIMIDPlayerConfig {
    environmentData;
    creativeData;

    constructor(playerState) {
        const {environmentData, creativeData} = playerState || {};
        this.environmentData = new SIMIDEnvironmentData(environmentData);
        this.creativeData = new SIMIDCreativeData(creativeData);
    }
}

export class SIMIDCreativeData {
    adParameters;
    clickThruUri;

    constructor(creativeData) {
        const {adParameters, clickThruUrl, clickThruUri} = creativeData || {};
        this.adParameters = adParameters;
        this.clickThruUri = clickThruUri || clickThruUrl;
    }
}

export class SIMIDEnvironmentData {
    videoDimensions;
    creativeDimensions;
    fullscreen;
    fullscreenAllowed;
    variableDurationAllowed;
    skippableState;
    skipoffset;
    version;
    siteUrl;
    appId;
    useragent;
    deviceId;
    muted;
    volume;
    navigationSupport;
    closeButtonSupport;
    nonlinearDuration;

    constructor(envData) {
        const {
            videoDimensions,
            creativeDimensions,
            fullscreen,
            fullscreenAllowed,
            variableDurationAllowed,
            skippableState,
            skipoffset,
            version,
            siteUrl,
            appId,
            useragent,
            deviceId,
            muted,
            volume,
            navigationSupport,
            closeButtonSupport,
            nonlinearDuration
        } = envData || {};

        this.videoDimensions = new SIMIDDimensions(videoDimensions);
        this.creativeDimensions = new SIMIDDimensions(creativeDimensions);
        this.fullscreen = !!fullscreen;
        this.fullscreenAllowed = !!fullscreenAllowed;
        this.variableDurationAllowed = !!variableDurationAllowed;
        this.skippableState = skippableState || 'notSkippable';
        this.skipoffset = skipoffset;
        this.version = version;
        this.siteUrl = siteUrl;
        this.appId = appId;
        this.useragent = useragent;
        this.deviceId = deviceId;
        this.muted = !!muted;
        this.volume = isNaN(volume) ? 1 : volume;
        this.navigationSupport = navigationSupport || 'notSupported';
        this.closeButtonSupport = closeButtonSupport || 'playerHandles';
        this.nonlinearDuration = nonlinearDuration || 0;
    }
}

export class SIMIDDimensions {
    x;
    y;
    width;
    height;

    constructor(dimensions) {
        const {x, y, width, height} = dimensions || {};

        function toDimension(value) {
            return isNaN(value) ? -1 : value
        }

        this.x = toDimension(x);
        this.y = toDimension(y);
        this.width = toDimension(width);
        this.height = toDimension(height);
    }
}

export class SIMIDMediaState {
    currentSrc;
    currentTime;
    duration;
    ended;
    muted;
    paused;
    volume;
    fullscreen;

    constructor(mediaState) {
        const {
            currentSrc,
            currentTime,
            duration,
            ended,
            muted,
            paused,
            volume,
            fullscreen
        } = mediaState || {};

        this.currentSrc = currentSrc;
        this.currentTime = currentTime || 0;
        this.duration = duration || 0;
        this.ended = !!ended;
        this.muted = !!muted;
        this.paused = !!paused;
        this.volume = volume || 0;
        this.fullscreen = !!fullscreen;
    }
}
