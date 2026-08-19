import { uuidv4 } from '../utils/uuid.js';

/**
 * @typedef {Error & { errorCode?: number, clientRequest?: SIMIDMessage }} SIMIDClientError
 * @typedef {{
 *     message: SIMIDMessage,
 *     resolve: (value?: unknown) => void,
 *     reject: (reason?: unknown) => void,
 *     timeout: ReturnType<typeof setTimeout> | null
 * }} SIMIDPendingRequest
 * @typedef {(event: Record<string, unknown> & { type: string }) => void} SIMIDEventCallback
 * @typedef {{
 *     currentSrc?: string,
 *     currentTime?: number,
 *     duration?: number,
 *     ended?: boolean,
 *     muted?: boolean,
 *     paused?: boolean,
 *     volume?: number,
 *     fullscreen?: boolean
 * }} SIMIDMediaStateInit
 */

/**
 * Provides an implementation of the Secure Interactive Media Interface Definition (SIMID) for use in
 * any web page loaded in the iframe created for the VAST <InteractiveCreativeFile> element.
 *
 * That is, provides the iframe client implementation of the SIMID message protocol, assuming the existence of the SIMID
 * Player with a currently playing ad video (as specified by the associated VAST <MediaFile> element). The SIMID Player is then the
 * producer of the SIMID messages.
 *
 * @see {@link https://interactiveadvertisingbureau.github.io/SIMID}
 */
export class SIMIDClient {
    /** @type {boolean} */
    isActive;
    /** @type {boolean} */
    isStopped;
    /** @type {boolean} */
    debug;

    /**
     * Will listen to SIMID player messages posted to the specified window, will post SIMID creative messages to
     * the window's parent.
     * @param {Window} contentWindow
     */
    constructor(contentWindow = window) {
        this._contentWindow = contentWindow;

        // Guard against self messaging
        this._playerWindow = contentWindow === contentWindow.parent ? undefined : contentWindow.parent;

        /** @type {Record<string, SIMIDPendingRequest>} */
        this._pendingClientRequests = {};
        this._nextMessageId = 0;
        /** @type {string | undefined} */
        this._sessionId = undefined;
        this.isActive = false;
        this.isStopped = false;
        this.debug = false;
        this._onPlayerMessage = this._onPlayerMessage.bind(this);

        /** @type {Record<string, SIMIDEventCallback[]>} */
        this._eventListeners = {};
        /** @type {SIMIDPlayerConfig | undefined} */
        this._playerConfig = undefined;
    }

    /**
     * @returns {Promise<void>}
     */
    async start() {
        if (this.isActive) return;
        this.isActive = true;
        this._contentWindow.addEventListener('message', this._onPlayerMessage);
        this._nextMessageId = 0;
        this._sessionId = uuidv4();
        this._playerConfig = undefined;
        this._pendingClientRequests = {};
        await this._sendClientRequest('createSession', {});
    }

    /**
     * @returns {Promise<void>}
     */
    async stop() {
        if (this.isStopped) return;
        this.isStopped = true;
        this._contentWindow.removeEventListener('message', this._onPlayerMessage);
        this._pendingClientRequests = {};
        this._eventListeners = {};
    }

    /**
     * @param {unknown} errorOrMessage
     * @returns {string}
     */
    getErrorMessage(errorOrMessage) {
        // Keep the class name for error subclasses
        const errMessage = (errorOrMessage instanceof Error)
            ? (errorOrMessage.constructor == Error) ? errorOrMessage.message : errorOrMessage.toString()
            : '' + errorOrMessage;
        return errMessage;
    }

    /**
     * @param {number} errorCode
     * @param {string | Error} errorOrMessage
     * @returns {void}
     */
    fatalError(errorCode, errorOrMessage) {
        const message = this.getErrorMessage(errorOrMessage);
        console.error(`SIMID fatal client error: ${errorCode} - ${message}`);
        const errorArgs = {errorCode, message};
        this._sendClientMessage('SIMID:Creative:fatalError', errorArgs);
        this.stop();
        this.onFatalError(errorCode, message); // in case any completion is needed
        this._invokeEventListeners('fatalError', errorArgs);
    }

    /**
     * @returns {Promise<SIMIDMediaState>}
     */
    getMediaState() {
        return this._sendClientRequest('SIMID:Creative:getMediaState')
            .then(response => {
                return new SIMIDMediaState(/** @type {SIMIDMediaStateInit} */ (response));
            });
    }

    /**
     * @param {{ x?: number, y?: number, uri?: string }} args
     * @returns {Promise<unknown>}
     */
    clickThru({ x, y, uri }) {
        const playerHandles = this._playerConfig?.environmentData.navigationSupport === 'playerHandles';
        return this._sendClientRequest('SIMID:Creative:clickThru', {x, y, playerHandles, uri });
    }

    /**
     * @param {string} message
     */
    log(message) {
        this._sendClientMessage('SIMID:Creative:log', {message});
    }

    /**
     * @param {string[]} trackingUrls
     * @returns {Promise<unknown>}
     */
    reportTracking(trackingUrls) {
        return this._sendClientRequest('SIMID:Creative:reportTracking', {trackingUrls});
    }

    /**
     * @param {number} duration use -2 to indicate an unknown duration
     * @returns {Promise<unknown>}
     */
    requestChangeAdDuration(duration) {
        const variableDurationAllowed = this._playerConfig?.environmentData.variableDurationAllowed;
        if (!variableDurationAllowed) {
            return Promise.reject(this._newClientError(SIMIDErrors.unspecifiedClientError,
                'requestChangeAdDuration not allowed when variableDurationAllowed is false'));
        }
        return this._sendClientRequest('SIMID:Creative:requestChangeAdDuration', { duration });
    }

    /**
     * @param {{ volume: number, muted: boolean }} args volume is 0...1 inclusive
     * @returns {Promise<unknown>}
     */
    requestChangeVolume({ volume, muted }) {
        return this._sendClientRequest('SIMID:Creative:requestChangeVolume', {volume, muted});
    }

    /**
     * @returns {Promise<unknown>}
     */
    requestFullscreen() {
        const fullscreenAllowed = this._playerConfig?.environmentData.fullscreenAllowed;
        if (!fullscreenAllowed) {
            return Promise.reject(this._newClientError(SIMIDErrors.unspecifiedClientError,
                'requestFullscreen not allowed when fullscreenAllowed is false'));
        }
        return this._sendClientRequest('SIMID:Creative:requestFullscreen');
    }

    /**
     * @returns {Promise<unknown>}
     */
    requestExitFullscreen() {
        const fullscreenAllowed = this._playerConfig?.environmentData.fullscreenAllowed;
        if (!fullscreenAllowed) {
            return Promise.reject(this._newClientError(SIMIDErrors.unspecifiedClientError,
                'requestExitFullscreen not allowed when fullscreenAllowed is false'));
        }
        return this._sendClientRequest('SIMID:Creative:requestExitFullscreen');
    }

    /**
     * @param {string} uri
     * @returns {Promise<unknown>}
     */
    requestNavigation(uri) {
        return this._sendClientRequest('SIMID:Creative:requestNavigation', { uri });
    }

    /**
     * @returns {Promise<unknown>}
     */
    requestPause() {
        const canPause = this._playerConfig?.environmentData.variableDurationAllowed;
        if (!canPause) {
            return Promise.reject(this._newClientError(SIMIDErrors.unspecifiedClientError,
                'requestPause not allowed when variableDurationAllowed is false'));
        }
        return this._sendClientRequest('SIMID:Creative:requestPause');
    }

    /**
     * @returns {Promise<unknown>}
     */
    requestPlay() {
        const canPlay = this._playerConfig?.environmentData.variableDurationAllowed;
        if (!canPlay) {
            return Promise.reject(this._newClientError(SIMIDErrors.unspecifiedClientError,
                'requestPlay not allowed when variableDurationAllowed is false'));
        }
        return this._sendClientRequest('SIMID:Creative:requestPlay');
    }

    /**
     * @param {{ mediaDimensions?: SIMIDDimensions, creativeDimensions?: SIMIDDimensions }} args
     * @returns {Promise<unknown>}
     */
    requestResize({ mediaDimensions, creativeDimensions }) {
        return this._sendClientRequest('SIMID:Creative:requestResize', { mediaDimensions, creativeDimensions });
    }

    /**
     * @returns {Promise<unknown>}
     */
    requestSkip() {
        return this._sendClientRequest('SIMID:Creative:requestSkip');
    }

    /**
     * @returns {Promise<unknown>}
     */
    requestStop() {
        return this._sendClientRequest('SIMID:Creative:requestStop');
    }

    /**
     * @param {MessageEvent} event
     * @returns {void}
     */
    _onPlayerMessage(event) {
        // Ignore non-SIMID messages, or those for other clients.
        if (!this.isActive) return;
        const eventData = event.data;
        if (!eventData || typeof eventData != 'string') return;

        const message = JSON.parse(eventData);
        const {sessionId, messageId, type, args} = message;
        if (!sessionId || isNaN(messageId) || !type) return;
        if (sessionId != this._sessionId) return;

        this._debugMessage('player message', message);

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
     * @param {unknown} [args]
     * @returns {void}
     * @private
     */
    _sendClientMessage(type, args) {
        if (!this.isActive) return; // no traffic allowed if not active
        if (this.isStopped && !(type == 'reject' || type == 'resolve')) return; // only responses allowed if stopped

        const message = this._createMessage(type, args);
        this._postClientMessage('client message', message);
    }

    /**
     * Sends a message to the SIMID player, but waits for a response.
     * @param {string} type
     * @param {unknown} [args]
     * @returns {Promise<unknown>}
     * @private
     */
    _sendClientRequest(type, args) {
        if (!this.isActive || this.isStopped) {
            // no traffic allowed if not active
            return Promise.resolve();
        }

        const message = this._createMessage(type, args);

        const promise = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                const timeoutMsg = "message response timeout";
                this._rejectClientMessage(message.messageId, SIMIDErrors.unspecifiedClientError, timeoutMsg);
            }, 5000);

            this._pendingClientRequests[message.messageId] = { message, resolve, reject, timeout };

            this._postClientMessage('client request', message);
        });
        return promise;
    }

    /**
     * @param {string} prefix
     * @param {SIMIDMessage} message
     * @returns {void}
     */
    _postClientMessage(prefix, message) {
        if (this._playerWindow) {
            this._debugMessage(prefix, message);
            this._playerWindow.postMessage(JSON.stringify(message), '*');
        } else {
            this._debugMessage(prefix + ' ignored', message);
        }
    }

    /**
     * @param {number} errorCode
     * @param {string} message
     * @returns {SIMIDClientError}
     */
    _newClientError(errorCode, message) {
        const error = /** @type {SIMIDClientError} */ (new Error(message));
        error.errorCode = errorCode;
        return error;
    }

    /**
     * @param {string} type
     * @param {unknown} [args]
     * @returns {SIMIDMessage}
     */
    _createMessage(type, args) {
        const messageId = this._nextMessageId;
        this._nextMessageId += 1;
        return new SIMIDMessage(this._sessionId, messageId, type, args);
    }

    /**
     * @param {string} prefix
     * @param {SIMIDMessage} msg
     * @returns {void}
     */
    _debugMessage(prefix, msg) {
        if (!this.debug) return;

        // ignore messages that already log themselves, or else cause too much noise.
        const isLogMsg = msg.type.endsWith(':log');
        const isErrMsg = msg.type.endsWith(':fatalError');
        const isMediaEvent = msg.type.startsWith('SIMID:Media:');
        const isRejectMsg = msg.type == 'reject';
        const isResolveMsg = msg.type == 'resolve';
        if (isLogMsg || isErrMsg || isMediaEvent || isRejectMsg || isResolveMsg) return;

        let logMsg = `SIMID ${prefix}: ${msg.messageId} ${msg.type}`;
        if (msg.args) logMsg += ': ' + JSON.stringify(msg.args);
        console.log(logMsg);
    }

    /**
     * @param {number} messageId
     * @param {unknown} value
     * @returns {void}
     */
    _resolveClientMessage(messageId, value) {
        const clientRequest = this._pendingClientRequests[messageId];
        if (!clientRequest) return;

        this._completeClientRequest(messageId);
        clientRequest.resolve(value);
    }

    /**
     * @param {number} messageId
     * @param {number} errorCode
     * @param {string} errMessage
     * @returns {void}
     */
    _rejectClientMessage(messageId, errorCode, errMessage) {
        const clientRequest = this._pendingClientRequests[messageId];
        if (!clientRequest) return;

        const msg = clientRequest.message;
        console.error(`SIMID reject client message ${msg.messageId} ${msg.type}: ${errorCode} - ${errMessage}`);

        this._completeClientRequest(messageId);

        const error = /** @type {SIMIDClientError} */ (new Error(errMessage));
        error.errorCode = errorCode;
        error.clientRequest = msg;
        clientRequest.reject(error);
    }

    /**
     * @param {number} messageId
     * @returns {void}
     */
    _completeClientRequest(messageId) {
        const clientRequest = this._pendingClientRequests[messageId];
        if (!clientRequest) return;

        delete this._pendingClientRequests[messageId];
        if (clientRequest.timeout) {
            clearTimeout(clientRequest.timeout);
            clientRequest.timeout = null;
        }
    }

    /**
     * @param {number} requestId
     * @param {string} requestType
     * @param {() => unknown} clientAction
     * @returns {unknown}
     */
    _playerResponse(requestId, requestType, clientAction) {
        let response;
        try {
            response = clientAction();
            if (response instanceof Promise) {
                return response
                    .then(result => {
                        this._resolvePlayerRequest(requestId, result);
                        return result;
                    })
                    .catch(err => {
                        return this._rejectPlayerRequest(requestId, requestType, SIMIDErrors.adInternalError, err);
                    });
            } else {
                this._resolvePlayerRequest(requestId, response);
            }
        } catch (error) {
            this._rejectPlayerRequest(requestId, requestType, SIMIDErrors.adInternalError, error);
        }
    }

    /**
     * @param {number} requestId
     * @param {unknown} value
     * @returns {void}
     */
    _resolvePlayerRequest(requestId, value) {
        this._sendClientMessage('resolve', { messageId: requestId, value });
    }

    /**
     * @param {number} requestId
     * @param {string} requestType
     * @param {number} errorCode
     * @param {unknown} errorOrMessage
     * @returns {void}
     */
    _rejectPlayerRequest(requestId, requestType, errorCode, errorOrMessage) {
        // Keep the class name for error subclasses/
        const errMessage = this.getErrorMessage(errorOrMessage);
        console.error(`SIMID reject player request ${requestId} ${requestType}: ${errorCode} - ${errMessage}`);

        this._sendClientMessage('reject', { messageId: requestId, value: { errorCode, message: errMessage } });
    }

    /**
     * @param {number} requestId
     * @param {string} requestType
     * @param {unknown} args
     * @returns {unknown}
     */
    _init(requestId, requestType, args) {
        this._playerConfig = new SIMIDPlayerConfig(args);
        return this._playerResponse(requestId, requestType, () => {
            this.onInit(/** @type {SIMIDPlayerConfig} */ (this._playerConfig));
            this._invokeEventListeners(requestType, this._playerConfig);
        });
    }

    /**
     * @param {number} requestId
     * @param {string} requestType
     * @returns {unknown}
     */
    _startCreative(requestId, requestType) {
        return this._playerResponse(requestId, requestType, () => {
            this.onStartCreative();
            this._invokeEventListeners(requestType);
        });
    }

    /**
     * @param {{ message?: string }} [args]
     * @returns {string | undefined}
     */
    _playerLog(args) {
        const message = args?.message;
        if (!message) return;
        this.onPlayerLog(message);
        this._invokeEventListeners('log', { message });
        return message;
    }

    /**
     * @param {{ videoDimensions?: SIMIDDimensions, creativeDimensions?: SIMIDDimensions, fullscreen?: boolean }} [args]
     * @returns {void}
     */
    _resize(args) {
        const videoDimensions = new SIMIDDimensions(args?.videoDimensions);
        const creativeDimensions = new SIMIDDimensions(args?.creativeDimensions);
        const fullscreen = !!args?.fullscreen;
        const resizeArgs = { videoDimensions, creativeDimensions, fullscreen };
        this.onResize(resizeArgs);
        this._invokeEventListeners('resize', resizeArgs);
    }

    /**
     * @param {number} requestId
     * @param {string} requestType
     * @returns {void}
     */
    _adSkipped(requestId, requestType) {
        this._playerResponse(requestId, requestType, () => {
            const possiblePromise = this.onAdSkipped();
            this._invokeEventListeners(requestType);
            this.stop();
            return possiblePromise;
        });
    }

    /**
     * @param {number} requestId
     * @param {string} requestType
     * @returns {void}
     */
    _adStopped(requestId, requestType) {
        this._playerResponse(requestId, requestType, () => {
            const possiblePromise = this.onAdStopped();
            this._invokeEventListeners(requestType);
            this.stop();
            return possiblePromise;
        });
    }

    /**
     * @param {number} requestId
     * @param {string} requestType
     * @returns {unknown}
     */
    _adBackgrounded(requestId, requestType) {
        return this._playerResponse(requestId, requestType, () => {
            this.onAdBackgrounded()
            this._invokeEventListeners(requestType);
        });
    }

    /**
     * @param {number} requestId
     * @param {string} requestType
     * @returns {void}
     */
    _adForegrounded(requestId, requestType) {
        // No promise response is sent.
        this.onAdForegrounded();
        this._invokeEventListeners(requestType);
    }

    /**
     * @param {{ errorCode?: number, message?: string }} [args]
     * @returns {void}
     */
    _playerFatalError(args) {
        const errorCode = args?.errorCode;
        const message = this.getErrorMessage(args?.message);
        console.error(`SIMID fatal player error: ${errorCode} - ${message}`);
        this.stop();
        this.onFatalError(errorCode, message); // in case any completion is needed
        this._invokeEventListeners('fatalError', { errorCode, message });
    }

    /**
     * @param {number} messageId
     * @param {string} type
     * @param {{ message?: string } | undefined} args
     * @returns {void}
     */
    _mediaEvent(messageId, type, args) {
        try {
            const eventType = this._getEventType(type);
            this.onMediaEvent(eventType, args);
            this._invokeEventListeners(eventType, args);
        } catch (error) {
            const message = this.getErrorMessage(args?.message);
            console.error(`SIMID error for media event: ${messageId} - ${type}: ${message}`);
        }
    }

    // Request event handlers: override as needed.

    /**
     * @param {SIMIDPlayerConfig} playerConfig
     * @returns {Promise<unknown> | void} should complete when client initialization is done
     */
    onInit(playerConfig) {
    }

    /**
     * Should not need to do anything by default, since page should in theory be already loading due to player init.
     * @returns {Promise<unknown> | void} should complete when start flow is complete
     */
    onStartCreative() {
    }

    /**
     * @param {string} message
     */
    onPlayerLog(message) {
        console.log('SIMID Player log: ' + message);
    }

    /**
     * Should not need to do anything by default, since iframe window resizes should already be handled in practice.
     * @param {{ videoDimension?: SIMIDDimensions, videoDimensions?: SIMIDDimensions, creativeDimensions?: SIMIDDimensions, fullscreen?: boolean }} args
     * @returns {void}
     */
    onResize({ videoDimension, creativeDimensions, fullscreen }) {
    }

    /**
     * @param {string} event
     * @param {unknown} [args]
     */
    onMediaEvent(event, args) {
    }

    /**
     * @returns {Promise<unknown> | void} a promise if a wait is needed before responding to the player
     */
    onAdSkipped() {
    }

    /**
     * @returns {Promise<unknown> | void} a promise if a wait is needed before responding to the player
     */
    onAdStopped() {
    }

    /**
     * @returns {Promise<unknown> | void} should complete when ad pause is complete
     */
    onAdBackgrounded() {
    }

    onAdForegrounded() {
    }

    /**
     * @param {number | undefined} errorCode
     * @param {string} message
     * @returns {void}
     */
    onFatalError(errorCode, message) {
    }

    // Event listener helpers for convenience.

    /**
     * @param {string} type
     * @param {(event: Record<string, unknown> & { type: string }) => void} callback
     */
    addEventListener(type, callback) {
        if (!callback) return;
        let eventCallbacks = this._eventListeners[type];
        if (!eventCallbacks) {
            eventCallbacks = [];
            this._eventListeners[type] = eventCallbacks;

        } else if (eventCallbacks.indexOf(callback) >= 0) {
            return; // already present
        }
        eventCallbacks.push(callback);
    }

    /**
     * @param {string} type
     * @param {(event: Record<string, unknown> & { type: string }) => void} callback
     */
    removeEventListener(type, callback) {
        if (!callback) return;
        let eventCallbacks = this._eventListeners[type];
        if (!eventCallbacks) return;

        const foundAt = eventCallbacks.indexOf(callback);
        if (foundAt < 0) return;

        eventCallbacks.splice(foundAt, 1);
    }

    /**
     * @param {string} type
     * @param {object} [data]
     * @returns {void}
     */
    _invokeEventListeners(type, data) {
        const eventType = this._getEventType(type);
        const eventCallbacks = this._eventListeners[eventType];
        if (!eventCallbacks || eventCallbacks.length <= 0) return;
        if (!data) data = {};
        const event = {...data, type: eventType};
        eventCallbacks.forEach(/** @param {SIMIDEventCallback} callback */ callback => {
            callback(event);
        });
    }

    /**
     * @param {string} messageType
     * @returns {string}
     */
    _getEventType(messageType) {
        const typeParts = messageType.split(':');
        const eventType = typeParts.length == 3 ? typeParts[2] : messageType;
        return eventType;
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

    /**
     * @param {string | undefined} sessionId
     * @param {number} messageId
     * @param {string} type
     * @param {unknown} [args]
     */
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

    /**
     * @param {unknown} [playerState]
     */
    constructor(playerState) {
        const {environmentData, creativeData} = /** @type {{ environmentData?: unknown, creativeData?: unknown }} */ (playerState || {});
        this.environmentData = new SIMIDEnvironmentData(environmentData);
        this.creativeData = new SIMIDCreativeData(creativeData);
    }
}

export class SIMIDCreativeData {
    adParameters;
    clickThruUri;

    /**
     * @param {unknown} [creativeData]
     */
    constructor(creativeData) {
        const {adParameters, clickThruUrl, clickThruUri} = /** @type {{ adParameters?: unknown, clickThruUrl?: string, clickThruUri?: string }} */ (creativeData || {});
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

    /**
     * @param {unknown} [envData]
     */
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
        } = /** @type {{
            videoDimensions?: { x?: number, y?: number, width?: number, height?: number },
            creativeDimensions?: { x?: number, y?: number, width?: number, height?: number },
            fullscreen?: boolean,
            fullscreenAllowed?: boolean,
            variableDurationAllowed?: boolean,
            skippableState?: string,
            skipoffset?: unknown,
            version?: unknown,
            siteUrl?: unknown,
            appId?: unknown,
            useragent?: unknown,
            deviceId?: unknown,
            muted?: boolean,
            volume?: number,
            navigationSupport?: string,
            closeButtonSupport?: string,
            nonlinearDuration?: number
        }} */ (envData || {});

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
        this.volume = isNaN(/** @type {number} */ (volume)) ? 1 : volume;
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

    /**
     * @param {{ x?: number, y?: number, width?: number, height?: number }} [dimensions]
     */
    constructor(dimensions) {
        const {x, y, width, height} = dimensions || {};

        /**
         * @param {unknown} value
         * @returns {number}
         */
        function toDimension(value) {
            const n = /** @type {number} */ (value);
            return isNaN(n) ? -1 : n;
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

    /**
     * Creates an instance of the media state manager, initializing the state of the media playback.
     *
     * @param {SIMIDMediaStateInit} [mediaState]
     */
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
