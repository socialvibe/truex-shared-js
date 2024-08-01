import { v4 as uuid } from 'uuid';
import { re } from "@babel/core/lib/vendor/import-meta-resolve";

/**
 * Provides an implementation of the Secure Interactive Media Interface Definition (SIMID) for use in
 * any web page loaded in the iframe created for the VAST <InteractiveCreativeFile> element.
 *
 * That is, provides the iframe client implementation of the SIMID message protocol, assuming the existence of the SIMID
 * Player with a currently playing ad video (as specified by the associated VAST <MediaFile> element). The SIMID Player is then the
 * producer of the SIMID messages.
 */
export class SIMIDClient {
    isActive;

    /**
     * Will listen to SIMID player messages posted to the specified window, will post SIMID creative messages to
     * the window's owner.
     * @param {Window} contentWindow
     */
    constructor(contentWindow = window) {
        this.contentWindow = contentWindow;
        this.playerWindow = contentWindow.owner || contentWindow.parent;
        this._pendingMessages = {};
        this._onWindowMessage = this._onWindowMessage.bind(this);
        this.isActive = false;
        this._nextMessageId = 0;
        this._sessionId = null;
    }

    start() {
        if (this.isActive) return;
        this.isActive = true;
        this.contentWindow.addEventListener('message', this._onWindowMessage);
        this._nextMessageId = 0;
        this._sessionId = uuid();
        this._playerConfig = null;
        this._sendMessage('createSession', {});
    }

    stop() {
        if (!this.isActive) return;
        this.isActive = false;
        this.contentWindow.removeEventListener('message', this._onWindowMessage);
        this._pendingMessages = {};
    }

    fatalError(errorCode, errorOrMessage) {
        const message = this.getErrorMessage(errorOrMessage);
        console.error(`SIMID fatal client error: ${errorCode} - ${message}`);
        this._sendMessage('SIMID:Creative:fatalError', { errorCode, message });
        this.stop();
    }

    getMediaState() {
        return this._sendMessage('SIMID:Creative:getMediaState')
            .then(response => {
                return new SIMIDMediaState(response);
            });
    }

    _onWindowMessage(event) {
        // Ignore non-SIMID messages, or those for other clients.
        if (!this.isActive) return;
        const data = event.data;
        if (!data) return;
        const {sessionId, messageId, type, args} = data;
        if (!sessionId || !messageId || !type) return;
        if (sessionId != this._sessionId) return;

        try {
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
                const event = type.split(':')[2];
                this.onMediaEvent(event, args);
                return;
            }

            // Handle requests.
            switch (type) {
                case 'SIMID:Player:Init':
                    this._init(messageId, type, args);
                    break;

                case 'SIMID:Player:startCreative':
                    this._startCreative(messageId, type);
                    break;

                case 'SIMID:Player:log':
                    this._log(args);
                    break;

                case 'SIMID:Player:resize':
                    this._resize(args);
                    break;
            }
        } catch (error) {
            this._rejectPlayerRequest(messageId, type, SIMIDErrors.adInternalError, error);
        }
    }

    _sendMessage(type, args) {
        if (!this.isActive) return;

        const message = this._createMessage(type, args);

        const promise = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                const timeoutMsg = "message response timeout";
                this._rejectClientMessage(message.id, SIMIDErrors.unspecifiedError, timeoutMsg);
                reject(this._createError(message, SIMIDErrors.unspecifiedError, timeoutMsg));
            }, 5000);

            this._pendingMessages[messageId] = { message, resolve, reject, timeout };

            this.playerWindow.postMessage(message, '*');
        });
        return promise;
    }

    _createMessage(type, args) {
        const messageId = this._nextMessageId;
        this._nextMessageId += 1;
        return new SIMIDMessage(this._sessionId, messageId, type, args);
    }

    getErrorMessage(errorOrMessage) {
        // Keep the class name for error subclasses/
        const errMessage = (errorOrMessage instanceof Error)
            ? (errorOrMessage.constructor == Error) ? errorOrMessage.message : errorOrMessage.toString()
            : '' + errorOrMessage;
        return errMessage;
    }

    _createError(msg, errroCode, message) {
        const error = new Error(message);
        error.code = errroCode;
        error.sentMessage = msg;
        return error;
    }

    _finishMessage(msgOrId) {
        const msgId = msgOrId?.id || msgOrId;
        if (!msgId) return;

        const pendingMsg = this._pendingMessages[msgId];
        if (!pendingMsg) return;

        delete this._pendingMessages[msgId];
        if (pendingMsg.timeout) {
            clearTimeout(pendingMsg.timeout);
            pendingMsg.timeout = null;
        }
    }

    _resolvePlayerRequest(requestId, value) {
        const response = this._createMessage('resolve', { messageId: requestId, value });
        this._finishMessage(requestId);
        this.playerWindow.postMessage(response, '*');
    }



    _rejectPlayerRequest(requestId, requestType, errorCode, errorOrMessage) {
        // Keep the class name for error subclasses/
        const errMessage = this.getErrorMessage(errorOrMessage);
        const response = this._createMessage('reject', { messageId: requestId, value: { errorCode, message: errMessage } });
        console.error(`SIMID reject player request ${requestId} ${requestType}: ${errorCode} - ${errMessage}`);
        this._finishMessage(requestId);
        this.playerWindow.postMessage(response, '*');
        return Promise.reject(errMessage);
    }

    _resolveClientMessage(messageId, value) {
        const pendingMsg = this._pendingMessages[messageId];
        if (!pendingMsg) return;
        this._finishMessage(pendingMsg.message);
        pendingMsg.resolve(value);
    }

    _rejectClientMessage(messageId, errorCode, errMessage) {
        const pendingMsg = this._pendingMessages[messageId];
        if (!pendingMsg) return;
        const msg = pendingMsg.message;
        this._finishMessage(pendingMsg.message);
        console.error(`SIMID reject client message ${msg.messageId} ${msg.type}: ${errorCode} - ${errMessage}`);
        pendingMsg.reject(value);
    }

    _playerResponse(requestId, requestType, clientAction) {
        let response;
        try {
            response = clientAction();
        } catch (error) {
            return this._rejectPlayerRequest(requestId, requestType, SIMIDErrors.adInternalError, error);
        }

        const promise = (response instanceof Promise) ? response : Promise.resolve(response);
        return promise
            .then(result => {
                this._resolvePlayerRequest(requestId, result);
                return result;
            })
            .catch(err => {
                this._rejectPlayerRequest(requestId, requestType, SIMIDErrors.adInternalError, err);
            });
    }

    _init(requestId, requestType, args) {
        this._playerConfig = new SIMIDPlayerConfig(args);
        return this._playerResponse(requestId, requestType, () => this.onInit(this._playerConfig));
    }

    _startCreative(requestId, requestType) {
        return this._playerResponse(requestId, requestType, () => this.onStartCreative());
    }

    _log(args) {
        const message = args?.message;
        if (!message) return;
        console.log('SIMID Player log: ' + message);
        return message;
    }

    _resize(args) {
        const videoDimension = new SIMIDDimensions(args?.videoDimensions);
        const creativeDimensions = new SIMIDDimensions(args?.creativeDimensions);
        const fullScreen = !!args?.fullscreen;
        this.onResize(videoDimension, creativeDimensions, fullScreen);
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

    /**
     * Should not need to do anything by default, since iframe window resizes should already be handled in practice.
     * @param {SIMIDDimensions} videoDimensions
     * @param {SIMIDDimensions} creativeDimensions
     * @param {boolean} fullScreen
     */
    onResize(videoDimension, creativeDimensions, fullScreen) {
    }

    onMediaEvent(event, args) {
    }
}

const SIMIDErrors = {
    unspecifiedError: 1100,
    adInternalError: 1108
}

class SIMIDMessage {
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
        const { environmentData, creativeData } = playerState;
        this.environmentData = new SIMIDEnvironmentData(environmentData);
        this.creativeData = new SIMIDCreativeData(creativeData);
    }
}

export class SIMIDCreativeData {
    adParameters;
    clickThruUri;

    constructor(creativeData) {
        const { adParameters, clickThruUrl, clickThruUri} = creativeData;
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
        const { x, y, width, height } = dimensions || {};
        function toDimension(value) { isNaN(value) ? -1 : value }

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
