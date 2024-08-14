import { SIMIDClient, SIMIDDimensions, SIMIDMessage, SIMIDErrors } from '../simid-client';
import { re } from "@babel/core/lib/vendor/import-meta-resolve";

describe('test simid client', () => {

    test('start/stop simid client', async () => {
        const { player, simidClient, playerWindow, adWindow } = newTestState();
        expect(simidClient._sessionId).toBeUndefined()

        player.sendPlayerMessage('test', {});
        expect(playerWindow.lastMessage).toBeUndefined();
        expect(simidClient.isActive).toBe(false);
        expect(adWindow.onPostMessage).toBeUndefined();

        expect(adWindow.lastMessage.type).toBe('test');

        const startPromise = simidClient.start();

        expect(simidClient.isActive).toBe(true);
        expect(simidClient._sessionId).toBeDefined();
        let clientMsg = playerWindow.lastMessage;
        expect(clientMsg).toEqual(expect.objectContaining(
            { sessionId: simidClient._sessionId, messageId: 0, type: 'createSession', args: {} }));
        expect(clientMsg?.timestamp).toBeLessThanOrEqual(Date.now());
        expect(player.sessionId).toEqual(simidClient._sessionId);


        // Acknowledge the createSession
        player.resolveClientRequest(clientMsg);

        await startPromise;
        expect(adWindow.lastMessage.type).toBe('resolve');

        // Ensure no message processing if not active.
        playerWindow.lastMessage = undefined;
        simidClient.stop();

        player.sendPlayerMessage('SIMID:Player:init', { });
        expect(playerWindow.lastMessage).toBeUndefined();
    });

    test('test initial ad flow', async () => {
        const state = newTestState();
        const { player, simidClient, playerWindow, adWindow } = state;

        simidClient.start();

        // Acknowledge the createSession
        expect(playerWindow.lastMessage.type).toBe('createSession');
        player.resolveClientRequest(playerWindow.lastMessage);

        testPlayerRequest(state, 'SIMID:Player:init', { });
        testPlayerRequest(state, 'SIMID:Player:startCreative', { });
    });

    test('test init reject', async () => {
        const state = newStartedTestState();
        const { player, simidClient, playerWindow, adWindow } = state;

        const errMessage = 'init test error';
        simidClient.onInit = () => { throw new Error(errMessage) };
        testPlayerReject(state, 'SIMID:Player:init', { }, SIMIDErrors.adInternalError, errMessage);
    });

    test('test startCreative reject', async () => {
        const state = newStartedTestState();
        const { player, simidClient, playerWindow, adWindow } = state;

        const errMessage = 'startCreative test error';
        simidClient.onStartCreative = () => { throw new Error(errMessage) };
        testPlayerReject(state, 'SIMID:Player:startCreative', { }, SIMIDErrors.adInternalError, errMessage);
    });

    test('test ad skipped', async () => {
        const state = newStartedTestState();
        const { simidClient, adWindow } = state;
        expect(simidClient.isActive).toBe(true);
        expect(adWindow.onPostMessage).toBeDefined();

        simidClient.onAdSkipped = jest.fn();
        testPlayerRequest(state, 'SIMID:Player:adSkipped');
        expect(simidClient.isActive).toBe(false);
        expect(adWindow.onPostMessage).toBeUndefined(); // i.e. removeEventListener was called
        expect(simidClient.onAdSkipped).toHaveBeenCalled();
    });

    test('test adSkipped reject', async () => {
        const state = newStartedTestState();
        const { player, simidClient, playerWindow, adWindow } = state;

        const errMessage = 'adSkipped test error';
        simidClient.onAdSkipped = () => { throw new Error(errMessage) };
        testPlayerReject(state, 'SIMID:Player:adSkipped', { }, SIMIDErrors.adInternalError, errMessage);
    });

    test('test ad stopped', () => {
        const state = newStartedTestState();
        const { simidClient } = state;
        expect(simidClient.isActive).toBe(true);

        simidClient.onAdStopped = jest.fn();
        testPlayerRequest(state, 'SIMID:Player:adStopped');
        expect(simidClient.isActive).toBe(false);
        expect(simidClient.onAdStopped).toHaveBeenCalled();
    });

    test('test adStopped reject', async () => {
        const state = newStartedTestState();
        const { player, simidClient, playerWindow, adWindow } = state;

        const errMessage = 'adStopped test error';
        simidClient.onAdStopped = () => { throw new Error(errMessage) };
        testPlayerReject(state, 'SIMID:Player:adStopped', { }, SIMIDErrors.adInternalError, errMessage);
    });

    test('test logging', () => {
        const { player, simidClient, playerWindow } = newStartedTestState();

        simidClient.debug = true; // also see how things log

        const playerLogMsg = 'test player log';
        simidClient.onPlayerLog = jest.fn();
        player.sendPlayerMessage('SIMID:Player:log', {message: playerLogMsg});
        expect(simidClient.onPlayerLog).toHaveBeenCalledWith(playerLogMsg);

        const clientLogMsg = 'test client log';
        simidClient.log(clientLogMsg);
        expect(playerWindow.lastMessage).toEqual(expect.objectContaining({args: {message: clientLogMsg}}));
    });

    test('test resize', () => {
        const { player, simidClient } = newStartedTestState();

        const videoDimensions = {x: 1, y: 2, width: 3, height: 4};
        const creativeDimensions = {x: 5, y: 6, width: 7, height: 8};
        const fullscreen = true;

        simidClient.onResize = jest.fn();
        player.sendPlayerMessage('SIMID:Player:resize', {videoDimensions, creativeDimensions, fullscreen});
        expect(simidClient.onResize).toHaveBeenCalledWith({ videoDimensions, creativeDimensions, fullscreen });
    });

    test('test resize reject', async () => {
        const state = newStartedTestState();
        const { player, simidClient, playerWindow, adWindow } = state;

        const errMessage = 'resize test error';
        simidClient.onResize = () => { throw new Error(errMessage) };
        testPlayerReject(state, 'SIMID:Player:resize', { }, SIMIDErrors.adInternalError, errMessage);
    });

    test('test requestResize', () => {
        const state = newStartedTestState();
        const { simidClient } = state;

        const resizeArgs = {
            mediaDimensions: {x: 1, y: 2, width: 3, height: 4},
            creativeDimensions: {x: 5, y: 6, width: 7, height: 8}
        };

        testClientRequest(state, 'SIMID:Creative:requestResize', resizeArgs, () => simidClient.requestResize(resizeArgs), undefined);
    });

    test('test background/foreground', () => {
        const { player, simidClient } = newStartedTestState();

        simidClient.onAdBackgrounded = jest.fn();
        player.sendPlayerMessage('SIMID:Player:adBackgrounded');
        expect(simidClient.onAdBackgrounded).toHaveBeenCalled();

        simidClient.onAdForegrounded = jest.fn();
        player.sendPlayerMessage('SIMID:Player:adForegrounded');
        expect(simidClient.onAdForegrounded).toHaveBeenCalled();
    });

    test('test backgrounded reject', async () => {
        const state = newStartedTestState();
        const { player, simidClient, playerWindow, adWindow } = state;

        const errMessage = 'adBackgrounded test error';
        simidClient.onAdBackgrounded = () => { throw new Error(errMessage) };
        testPlayerReject(state, 'SIMID:Player:adBackgrounded', { }, SIMIDErrors.adInternalError, errMessage);
    });

    test('test player fatalError', () => {
        const { player, simidClient } = newStartedTestState();

        simidClient.debug = true; // also see how things log

        const fatalError = { errorCode: 999, message: 'test player error' };
        simidClient.onFatalError = jest.fn();
        player.sendPlayerMessage('SIMID:Player:fatalError', fatalError);

        expect(simidClient.onFatalError).toHaveBeenCalledWith(fatalError.errorCode, fatalError.message);
        expect(simidClient.isActive).toBe(false);
    });

    test('test client fatalError', () => {
        const { simidClient, playerWindow } = newStartedTestState();;

        const fatalError = { errorCode: 999, message: 'test client error' };
        simidClient.fatalError(fatalError.errorCode, fatalError.message);
        expect(playerWindow.lastMessage.args).toEqual(fatalError);
        expect(simidClient.isActive).toBe(false);
    });

    test('test getMediaState', async () => {
        const state = newStartedTestState();
        const { simidClient } = state;

        const result = {
            currentSrc: 'https://media.truex.com/some-video.mp4',
            currentTime: 13,
            duration: 35,
            ended: false,
            muted: false,
            paused: true,
            volume: 0.5,
            fullscreen: false
        };

        await testClientRequest(state, 'SIMID:Creative:getMediaState', undefined, () => simidClient.getMediaState(), result);
    });

    test('test reportTracking', async () => {
        const state = newStartedTestState();
        const { simidClient } = state;

        const requestArgs = {
            trackingUrls: [
                "https://measure.truex.com/tracking/1.gif",
                "https://measure.truex.com/tracking/2.gif",
            ]
        };

        await testClientRequest(state, 'SIMID:Creative:reportTracking', requestArgs,
            () => simidClient.reportTracking(requestArgs.trackingUrls), undefined);
        await testClientReject(state, 'SIMID:Creative:reportTracking', requestArgs,
            () => simidClient.reportTracking(requestArgs.trackingUrls),
            SIMIDErrors.unspecifiedPlayerError, 'tracking rejected');
    });

    test('test requestChangeAdDuration', async () => {
        const state = newStartedTestState();
        const { simidClient } = state;

        const duration = 123;
        const requestArgs = { duration };

        simidClient._playerConfig = { variableDurationAllowed: false };
        await testClientReject(state, undefined, undefined,
            () => simidClient.requestChangeAdDuration(duration),
            SIMIDErrors.unspecifiedClientError, 'requestChangeAdDuration not allowed when variableDurationAllowed is false');

        simidClient._playerConfig = { variableDurationAllowed: true };
        await testClientRequest(state, 'SIMID:Creative:requestChangeAdDuration', requestArgs,
            () => simidClient.requestChangeAdDuration(duration), undefined);
        await testClientReject(state, 'SIMID:Creative:requestChangeAdDuration', requestArgs,
            () => simidClient.requestChangeAdDuration(duration),
            SIMIDErrors.unspecifiedPlayerError, 'duration change rejected');
    });

    test('test requestChangeVolume', async () => {
        const state = newStartedTestState();
        const { simidClient } = state;

        const requestArgs = {
            volume: 0.8,
            muted: true
        };

        await testClientRequest(state, 'SIMID:Creative:requestChangeVolume', requestArgs,
            () => simidClient.requestChangeVolume(requestArgs), undefined);
        await testClientReject(state, 'SIMID:Creative:requestChangeVolume', requestArgs,
            () => simidClient.requestChangeVolume(requestArgs),
            SIMIDErrors.unspecifiedPlayerError, 'volume change rejected');
    });

    test('test requestFullscreen', async () => {
        const state = newStartedTestState();
        const { simidClient } = state;

        simidClient._playerConfig = { fullscreenAllowed: false };
        await testClientReject(state, undefined, undefined,
            () => simidClient.requestFullscreen(), SIMIDErrors.unspecifiedClientError, 'requestFullscreen not allowed when fullscreenAllowed is false');

        simidClient._playerConfig = { fullscreenAllowed: true };
        await testClientRequest(state, 'SIMID:Creative:requestFullscreen', undefined,
            () => simidClient.requestFullscreen(), undefined);

        await testClientReject(state, 'SIMID:Creative:requestFullscreen', undefined,
            () => simidClient.requestFullscreen(), SIMIDErrors.unspecifiedPlayerError, 'requestFullscreen rejected');
    });

    test('test requestExitFullscreen', async () => {
        const state = newStartedTestState();
        const { simidClient } = state;

        simidClient._playerConfig = { fullscreenAllowed: false };
        await testClientReject(state, undefined, undefined,
            () => simidClient.requestExitFullscreen(), SIMIDErrors.unspecifiedClientError, 'requestExitFullscreen not allowed when fullscreenAllowed is false');

        simidClient._playerConfig = { fullscreenAllowed: true };
        await testClientRequest(state, 'SIMID:Creative:requestExitFullscreen', undefined,
            () => simidClient.requestExitFullscreen(), undefined);

        await testClientReject(state, 'SIMID:Creative:requestExitFullscreen', undefined,
            () => simidClient.requestExitFullscreen(), SIMIDErrors.unspecifiedPlayerError, 'requestExitFullscreen rejected');
    });

    test('test clickThru', async () => {
        const state = newStartedTestState();
        const { simidClient } = state;

        simidClient._playerConfig = { navigationSupport: 'adHandles' };
        const callArgs = {
            x: 1, y: 2, uri: 'some uri'
        }
        const requestArgs = {
            ...callArgs,
            playerHandles: false
        }
        await testClientRequest(state, 'SIMID:Creative:clickThru', requestArgs,
            () => simidClient.clickThru(callArgs), undefined);

        simidClient._playerConfig = { navigationSupport: 'playerHandles' };
        requestArgs.playerHandles = true;
        await testClientRequest(state, 'SIMID:Creative:clickThru', requestArgs,
            () => simidClient.clickThru(callArgs), undefined);

        await testClientReject(state, 'SIMID:Creative:clickThru', requestArgs,
            () => simidClient.clickThru(callArgs), SIMIDErrors.unspecifiedPlayerError, 'clickThru rejected');
    });

    test('test requestNavigation', async () => {
        const state = newStartedTestState();
        const { simidClient } = state;

        const uri = 'some uri';
        const requestArgs = { uri };

        await testClientRequest(state, 'SIMID:Creative:requestNavigation', requestArgs,
            () => simidClient.requestNavigation(uri), undefined);

        await testClientReject(state, 'SIMID:Creative:requestNavigation', requestArgs,
            () => simidClient.requestNavigation(uri), SIMIDErrors.unspecifiedPlayerError, 'requestNavigation rejected');
    });

    test('test requestPause', async () => {
        const state = newStartedTestState();
        const { simidClient } = state;

        simidClient._playerConfig = { variableDurationAllowed: false };
        await testClientReject(state, undefined, undefined,
            () => simidClient.requestPause(),
            SIMIDErrors.unspecifiedClientError, 'requestPause not allowed when variableDurationAllowed is false');

        simidClient._playerConfig = { variableDurationAllowed: true };
        await testClientRequest(state, 'SIMID:Creative:requestPause', undefined,
            () => simidClient.requestPause(), undefined);
        await testClientReject(state, 'SIMID:Creative:requestPause', undefined,
            () => simidClient.requestPause(),
            SIMIDErrors.unspecifiedPlayerError, 'requestPause rejected');
    });

    test('test requestPlay', async () => {
        const state = newStartedTestState();
        const { simidClient } = state;

        simidClient._playerConfig = { variableDurationAllowed: false };
        await testClientReject(state, undefined, undefined,
            () => simidClient.requestPlay(),
            SIMIDErrors.unspecifiedClientError, 'requestPlay not allowed when variableDurationAllowed is false');

        simidClient._playerConfig = { variableDurationAllowed: true };
        await testClientRequest(state, 'SIMID:Creative:requestPlay', undefined,
            () => simidClient.requestPlay(), undefined);
        await testClientReject(state, 'SIMID:Creative:requestPlay', undefined,
            () => simidClient.requestPlay(),
            SIMIDErrors.unspecifiedPlayerError, 'requestPlay rejected');
    });

    test('test requestSkip', async () => {
        const state = newStartedTestState();
        const { simidClient } = state;

        await testClientRequest(state, 'SIMID:Creative:requestSkip', undefined,
            () => simidClient.requestSkip(), undefined);
        await testClientReject(state, 'SIMID:Creative:requestSkip', undefined,
            () => simidClient.requestSkip(),
            SIMIDErrors.unspecifiedPlayerError, 'requestSkip rejected');
    });

    test('test requestStop', async () => {
        const state = newStartedTestState();
        const { simidClient } = state;

        simidClient.debug = true; // also see how things log

        await testClientRequest(state, 'SIMID:Creative:requestStop', undefined,
            () => simidClient.requestStop(), undefined);
        await testClientReject(state, 'SIMID:Creative:requestStop', undefined,
            () => simidClient.requestStop(),
            SIMIDErrors.unspecifiedPlayerError, 'requestStop rejected');
    });

    test('test media events', () => {
        const { player, simidClient, playerWindow } = newStartedTestState();;

        function testEvent(event, args = {}) {
            simidClient.onMediaEvent = jest.fn();

            const eventListener = jest.fn();
            simidClient.addEventListener(event, eventListener);

            player.sendPlayerMessage('SIMID:Media:' + event, args);
            expect(simidClient.onMediaEvent).toHaveBeenCalledWith(event, args);

            const expectedEvent = {...args, type: event};
            expect(eventListener).toHaveBeenCalledWith(event, expectedEvent);

            // Verify event cleanup
            expect(simidClient._eventListeners[event].find(eventListener)).toBeGreaterThanOrEqual(0);
            simidClient.removeEventListener(event, eventListener);
            expect(simidClient._eventListeners[event].find(eventListener)).toBe(-1);
        }

        testEvent('durationchange', {duration: 123});
        testEvent('ended');
        testEvent('error', {error: 123, message: 'test media error'});
        testEvent('pause');
        testEvent('play');
        testEvent('playing');
        testEvent('seeked');
        testEvent('seeking');
        testEvent('stalled');
        testEvent('timeupdate', {currentTime: 123});
        testEvent('volumechange', {volume: 0.5, muted: true});
    });
});

function testPlayerRequest(state, type, args, supportsEventListener = true, expectedEventData = {}) {
    const { player, playerWindow, simidClient } = state;
    const requestMsg = player.sendPlayerMessage(type, args);

    const eventListener = supportsEventListener ? jest.fn() : undefined;
    const eventType = simidClient._getEventType(type);
    if (eventListener) {
        simidClient.addEventListener(eventType, eventListener);
    }

    expect(playerWindow.lastMessage).toEqual(expect.objectContaining({type: 'resolve', args: {messageId: requestMsg.messageId, value: undefined}}));

    if (eventListener) {
        const expectedEvent = {...expectedEventData, type: eventType};
        expect(eventListener).toHaveBeenCalledWith(expectedEvent);

        // Verify event cleanup
        expect(simidClient._eventListeners[eventType].find(eventListener)).toBeGreaterThanOrEqual(0);
        simidClient.removeEventListener(eventType, eventListener);
        expect(simidClient._eventListeners[eventType].find(eventListener)).toBe(-1);
    }
}

function testPlayerReject(state, type, args, errorCode, errMessage) {
    const { player, playerWindow } = state;
    const requestMsg = player.sendPlayerMessage(type, args);
    expect(playerWindow.lastMessage).toEqual(expect.objectContaining({type: 'reject', args: {messageId: requestMsg.messageId, value: { errorCode, message: errMessage }}}));
}

async function testClientRequest(state, type, expectedArgs, requestAction, requestResult) {
    const { player, simidClient, playerWindow, adWindow } = state;
    playerWindow.lastMessage = null;
    adWindow.lastMessage = null;

    const requestPromise = requestAction();

    const clientMsg = playerWindow.lastMessage;
    expect(clientMsg).toBeDefined();
    expect(clientMsg.type).toEqual(type);
    expect(clientMsg.args).toEqual(expectedArgs);

    player.resolveClientRequest(clientMsg, requestResult);

    await expect(requestPromise).resolves.toEqual(requestResult);

    const resolveMsg = adWindow.lastMessage;
    expect(resolveMsg).toBeDefined();
    expect(resolveMsg.type).toEqual('resolve');
    expect(resolveMsg.args).toEqual({ messageId: clientMsg.messageId, value: requestResult });
}

async function testClientReject(state, type, expectedArgs, requestAction, errorCode, errMessage) {
    const { player, simidClient, playerWindow, adWindow } = state;
    playerWindow.lastMessage = null;
    adWindow.lastMessage = null;

    const requestPromise = requestAction();

    const clientMsg = playerWindow.lastMessage;

    if (!type) {
        // Expect no message to have been sent.
        // Instead the client should have rejected locally.
        expect(clientMsg).toBeNull();

    } else {
        player.rejectClientRequest(clientMsg, errorCode, errMessage);
    }

    await expect(requestPromise).rejects.toThrowError({ errorCode, message: errMessage, clientRequest: clientMsg });

    if (type) {
        const resolveMsg = adWindow.lastMessage;
        expect(resolveMsg).toBeDefined();
        expect(resolveMsg.type).toEqual('reject');
        expect(resolveMsg.args).toEqual({messageId: clientMsg.messageId, value: {errorCode, message: errMessage}});
    }
}

// Stub to fake window postMessage processing without requiring real DOM/iframe windows
class WindowStub {
    id;
    parent;
    onPostMessage;
    lastMessage;

    constructor(id) {
       this.id = id;
    }

    postMessage(msgJson, domain) {
        this.lastMessage = JSON.parse(msgJson);
        if (!this.onPostMessage) return;
        this.onPostMessage({data: msgJson})
    }

    addEventListener(type, listener) {
        if (type == 'message') {
            this.onPostMessage = listener;
        }
    }

    removeEventListener(type, listener) {
        if (type == 'message' && this.onPostMessage === listener) {
            this.onPostMessage = undefined;
        }
    }
}

class PlayerStub {
    sessionId;
    playerWindow;
    adWindow;

    constructor(playerWindow, adWindow) {
        this._nextMessageId = 0;

        this.playerWindow = playerWindow;
        this.playerWindow.onPostMessage = event => this.onPostMessage(event);

        this.adWindow = adWindow;
        this.adWindow.parent = playerWindow;
    }

    sendPlayerMessage(type, args) {
        this.playerWindow.lastMessage = undefined;
        const msg = new SIMIDMessage(this.sessionId, this._nextMessageId, type, args);
        this._nextMessageId += 1;
        this.adWindow.postMessage(JSON.stringify(msg), '*');
        return msg;
    }

    onPostMessage(event) {
        const eventData = event.data;
        if (!eventData || typeof eventData != 'string') return;

        const message = JSON.parse(eventData);
        const {sessionId, messageId, type, args} = message;
        if (!sessionId || isNaN(messageId) || !type) return;

        if (type == 'createSession') {
            this.sessionId = sessionId;
        }
    }

    resolveClientRequest(clientMsg, value) {
        this.sendPlayerMessage('resolve', {messageId: clientMsg.messageId, value });
    }

    rejectClientRequest(clientMsg, errorCode, errMessage) {
        this.sendPlayerMessage('reject', {messageId: clientMsg.messageId, value: { errorCode, message: errMessage } });
    }
}

/**
 * @return {{adWindow: WindowStub, simidClient: SIMIDClient, playerWindow: WindowStub, player: PlayerStub}}
 */
function newTestState() {
    const playerWindow = new WindowStub('playerWindow');
    const adWindow = new WindowStub('adWindow');

    const player = new PlayerStub(playerWindow, adWindow);

    const simidClient = new SIMIDClient(adWindow);

    return {
        player,
        simidClient,
        playerWindow,
        adWindow
    };
}

function newStartedTestState() {
    const state = newTestState();
    state.simidClient.start();
    state.simidClient._pendingClientRequests = {};
    state.player.sessionId = state.simidClient._sessionId;
    return state;
}
