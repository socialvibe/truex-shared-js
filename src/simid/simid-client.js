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

    _onWindowMessage(event) {
        // Ignore non-SIMID messages, or those for other clients.
        if (!this.isActive) return;
        const data = event.data;
        if (!data) return;
        const { sessionId, messageId, type, args } = data;
        if (!sessionId || !messageId || !type) return;
        if (sessionId != this._sessionId) return;

        // Handle responses first.
        switch (type) {
            case 'resolve':
                this._resolveClientMessage(args?.messageId, args?.value);
                return;

            case 'reject':
                this._rejectClientMessage(args?.messageId, args?.value);
                return;
        }

        // Handle requests.
        try {
            switch (type) {
                case 'SIMID:Player:Init':
                    this._init(messageId, type, args);
                    break;
            }
        } catch (error) {
            this._rejectPlayerRequest(messageId, type, SIMIDErrors.unspecifiedError, error);
        }
    }

    _sendMessage(type, args) {
        const message = this._createMessage(type, args);

        const promise = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                this._finishMessage(message);
                reject(this._createError(message, SIMIDErrors.unspecifiedError, "message response timeout"));
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
        const errMessage = (errorOrMessage instanceof Error)
            ? (errorOrMessage.constructor == Error) ? errorOrMessage.message : errorOrMessage.toString()
            : '' + errorOrMessage;
        const response = this._createMessage('reject', { messageId: requestId, value: { errorCode, message: errMessage } });
        console.error(`SIMID Client error for request ${requestId} ${requestType}: ${errorCode} - ${errMessage}`);
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

    _rejectClientMessage(messageId, value) {
        const pendingMsg = this._pendingMessages[messageId];
        if (!pendingMsg) return;
        const msg = pendingMsg.message;
        this._finishMessage(pendingMsg.message);
        console.error(`SIMID Player rejection for message ${msg.messageId} ${msg.type}: ${value?.errorCode} - ${value?.message}`);
        pendingMsg.reject(value);
    }

    _playerResponse(requestId, requestType, clientAction) {
        let response;
        try {
            response = clientAction();
        } catch (error) {
            return this._rejectPlayerRequest(requestId, requestType, SIMIDErrors.unspecifiedError, error);
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

    _init(requestId, requestType, playerConfig) {
        this._playerConfig = new SIMIDPlayerConfig(playerConfig);
        return this._playerResponse(requestId, requestType, () => this.onInit(this._playerConfig));
    }

    // Request handlers: override as needed.

    /**
     * @param {SIMIDPlayerConfig} playerConfig
     */
    onInit(playerConfig) {
        // Override as needed. Must return a promise that completes when client initialization is done.
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

    createRejectMessage(errorCode, message) {
        const error = {errorCode, message};
        return new SIMIDMessage(this.sessionId)
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

export class SIMIDEnvironmentData {

}

export class SIMIDCreativeData {

}
