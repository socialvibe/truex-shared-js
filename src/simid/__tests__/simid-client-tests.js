import { describe, test, mock } from 'node:test';
import assert from 'node:assert';
import {
    SIMIDClient,
    SIMIDDimensions,
    SIMIDMessage,
    SIMIDErrors,
    SIMIDPlayerConfig,
    SIMIDMediaState
} from '../simid-client.js';
import 'global-jsdom/register';

describe('test simid client', () => {

    test('start/stop simid client', async () => {
        const {player, simidClient, playerWindow, adWindow} = newTestState();
        assert.strictEqual(simidClient._sessionId, undefined);

        player.sendPlayerMessage('test', {});
        assert.strictEqual(playerWindow.lastMessage, undefined);
        assert.strictEqual(simidClient.isActive, false);
        assert.strictEqual(adWindow.onPostMessage, undefined);

        assert.strictEqual(adWindow.lastMessage.type, 'test');

        const startPromise = simidClient.start();

        assert.strictEqual(simidClient.isActive, true);
        assert.notStrictEqual(simidClient._sessionId, undefined);
        let clientMsg = playerWindow.lastMessage;
        assert.strictEqual(clientMsg.sessionId, simidClient._sessionId);
        assert.strictEqual(clientMsg.messageId, 0);
        assert.strictEqual(clientMsg.type, 'createSession');
        assert.deepStrictEqual(clientMsg.args, {});
        assert.ok(clientMsg?.timestamp <= Date.now());
        assert.strictEqual(player.sessionId, simidClient._sessionId);


        // Acknowledge the createSession
        player.resolveClientRequest(clientMsg);

        await startPromise;
        assert.strictEqual(adWindow.lastMessage.type, 'resolve');

        // Ensure no message processing if not active.
        playerWindow.lastMessage = undefined;
        simidClient.stop();

        player.sendPlayerMessage('SIMID:Player:init', {});
        assert.strictEqual(playerWindow.lastMessage, undefined);
    });

    test('test initial ad flow', () => {
        const state = newTestState();
        const {player, simidClient, playerWindow, adWindow} = state;

        simidClient.start();

        // Acknowledge the createSession
        assert.strictEqual(playerWindow.lastMessage.type, 'createSession');
        player.resolveClientRequest(playerWindow.lastMessage);

        testPlayerRequest(state, 'SIMID:Player:init', new SIMIDPlayerConfig());
        testPlayerRequest(state, 'SIMID:Player:startCreative', {});
    });

    test('test init reject', () => {
        const state = newStartedTestState();
        const {player, simidClient, playerWindow, adWindow} = state;

        const errMessage = 'init test error';
        simidClient.onInit = () => { throw new Error(errMessage) };
        testPlayerReject(state, 'SIMID:Player:init', {}, SIMIDErrors.adInternalError, errMessage);
    });

    test('test startCreative reject', () => {
        const state = newStartedTestState();
        const {player, simidClient, playerWindow, adWindow} = state;

        const errMessage = 'startCreative test error';
        simidClient.onStartCreative = () => { throw new Error(errMessage) };
        testPlayerReject(state, 'SIMID:Player:startCreative', {}, SIMIDErrors.adInternalError, errMessage);
    });

    test('test adSkipped', () => {
        const state = newStartedTestState();
        const {simidClient, adWindow} = state;
        assert.strictEqual(simidClient.isActive, true);
        assert.notStrictEqual(adWindow.onPostMessage, undefined);

        simidClient.onAdSkipped = mock.fn();
        testPlayerRequest(state, 'SIMID:Player:adSkipped');
        assert.strictEqual(simidClient.isActive, true);
        assert.strictEqual(simidClient.isStopped, true);
        assert.strictEqual(simidClient.onAdSkipped.mock.callCount(), 1);
        assert.strictEqual(adWindow.onPostMessage, undefined); // i.e. removeEventListener was called
    });

    test('test adSkipped reject', () => {
        const state = newStartedTestState();
        const {player, simidClient, playerWindow, adWindow} = state;

        const errMessage = 'adSkipped test error';
        simidClient.onAdSkipped = () => { throw new Error(errMessage) };
        testPlayerReject(state, 'SIMID:Player:adSkipped', { }, SIMIDErrors.adInternalError, errMessage);
    });

    test('test async adSkipped', async () => {
        const state = newStartedTestState();
        const {simidClient} = state;
        assert.strictEqual(simidClient.isActive, true);

        let responsePromise;
        let resolved = false;
        simidClient.onAdSkipped = () => {
            responsePromise = new Promise((resolve, reject) => {
                setTimeout(() => {
                    resolved = true;
                    resolve();
                }, 50);
            });
            return responsePromise;
        };
        await testPlayerRequest(state, 'SIMID:Player:adSkipped', undefined, () => responsePromise);
        assert.strictEqual(simidClient.isStopped, true);
        assert.strictEqual(resolved, true);
    });

    test('test adStopped', () => {
        const state = newStartedTestState();
        const {simidClient} = state;
        assert.strictEqual(simidClient.isActive, true);

        simidClient.onAdStopped = mock.fn();
        testPlayerRequest(state, 'SIMID:Player:adStopped');
        assert.strictEqual(simidClient.isActive, true);
        assert.strictEqual(simidClient.isStopped, true);
        assert.strictEqual(simidClient.onAdStopped.mock.callCount(), 1);
    });

    test('test adStopped reject', () => {
        const state = newStartedTestState();
        const {player, simidClient, playerWindow, adWindow} = state;
        const errMessage = 'adStopped test error';
        simidClient.onAdStopped = () => {throw new Error(errMessage)};
        testPlayerReject(state, 'SIMID:Player:adStopped', {}, SIMIDErrors.adInternalError, errMessage);
    });

    test('test async adStopped', async () => {
        const state = newStartedTestState();
        const {simidClient} = state;
        assert.strictEqual(simidClient.isActive, true);

        let responsePromise;
        let resolved = false;
        simidClient.onAdStopped = () => {
            responsePromise = new Promise((resolve, reject) => {
                setTimeout(() => {
                    resolved = true;
                    resolve();
                }, 2000);
            });
            return responsePromise;
        };
        await testPlayerRequest(state, 'SIMID:Player:adStopped', undefined, () => responsePromise);
        assert.strictEqual(simidClient.isStopped, true);
        assert.strictEqual(resolved, true);
    });

    test('test logging', () => {
        const {player, simidClient, playerWindow} = newStartedTestState();

        simidClient.debug = true; // also see how things log

        const playerLogMsg = 'test player log';
        simidClient.onPlayerLog = mock.fn();
        player.sendPlayerMessage('SIMID:Player:log', {message: playerLogMsg});
        assert.strictEqual(simidClient.onPlayerLog.mock.callCount(), 1);
        assert.deepStrictEqual(simidClient.onPlayerLog.mock.calls[0].arguments, [playerLogMsg]);

        const clientLogMsg = 'test client log';
        simidClient.log(clientLogMsg);
        assert.deepStrictEqual(playerWindow.lastMessage.args, {message: clientLogMsg});
    });

    test('test resize', () => {
        const {player, simidClient} = newStartedTestState();

        const videoDimensions = { x: 1, y: 2, width: 3, height: 4 };
        const creativeDimensions = { x: 5, y: 6, width: 7, height: 8 };
        const fullscreen = true;

        simidClient.onResize = mock.fn();
        player.sendPlayerMessage('SIMID:Player:resize', { videoDimensions, creativeDimensions, fullscreen });
        assert.strictEqual(simidClient.onResize.mock.callCount(), 1);
        assert.strictEqual(simidClient.onResize.mock.calls[0].arguments.length, 1);
        assert.deepEqual(simidClient.onResize.mock.calls[0].arguments[0], { videoDimensions, creativeDimensions, fullscreen });
    });

    test('test resize reject', () => {
        const state = newStartedTestState();
        const {player, simidClient, playerWindow, adWindow} = state;

        const errMessage = 'resize test error';
        simidClient.onResize = () => { throw new Error(errMessage) };
        testPlayerReject(state, 'SIMID:Player:resize', {}, SIMIDErrors.adInternalError, errMessage);
    });

    test('test requestResize', () => {
        const state = newStartedTestState();
        const {simidClient} = state;

        const resizeArgs = {
            mediaDimensions: {x: 1, y: 2, width: 3, height: 4},
            creativeDimensions: {x: 5, y: 6, width: 7, height: 8}
        };

        testClientRequest(state, 'SIMID:Creative:requestResize', resizeArgs, () => simidClient.requestResize(resizeArgs), undefined);
    });

    test('test background/foreground', () => {
        const {player, simidClient} = newStartedTestState();

        simidClient.onAdBackgrounded = mock.fn();
        player.sendPlayerMessage('SIMID:Player:adBackgrounded');
        assert.strictEqual(simidClient.onAdBackgrounded.mock.callCount(), 1);

        simidClient.onAdForegrounded = mock.fn();
        player.sendPlayerMessage('SIMID:Player:adForegrounded');
        assert.strictEqual(simidClient.onAdForegrounded.mock.callCount(), 1);
    });

    test('test backgrounded reject', () => {
        const state = newStartedTestState();
        const {player, simidClient, playerWindow, adWindow} = state;

        const errMessage = 'adBackgrounded test error';
        simidClient.onAdBackgrounded = () => { throw new Error(errMessage) };
        testPlayerReject(state, 'SIMID:Player:adBackgrounded', {}, SIMIDErrors.adInternalError, errMessage);
    });

    test('test player fatalError', () => {
        const {player, simidClient} = newStartedTestState();

        simidClient.debug = true; // also see how things log

        const fatalError = {errorCode: 999, message: 'test player error'};
        simidClient.onFatalError = mock.fn();
        player.sendPlayerMessage('SIMID:Player:fatalError', fatalError);

        assert.strictEqual(simidClient.onFatalError.mock.callCount(), 1);
        assert.deepStrictEqual(simidClient.onFatalError.mock.calls[0].arguments, [fatalError.errorCode, fatalError.message]);
        assert.strictEqual(simidClient.isActive, true);
        assert.strictEqual(simidClient.isStopped, true);
    });

    test('test client fatalError', () => {
        const { simidClient, playerWindow } = newStartedTestState();

        const fatalError = {errorCode: 999, message: 'test client error'};
        simidClient.fatalError(fatalError.errorCode, fatalError.message);
        assert.deepStrictEqual(playerWindow.lastMessage.args, fatalError);
        assert.strictEqual(simidClient.isActive, true);
        assert.strictEqual(simidClient.isStopped, true);
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

        await testClientRequest(
            state,
            'SIMID:Creative:getMediaState',
            undefined,
            () => simidClient.getMediaState(),
            result
        );
    });

    test('test reportTracking', async () => {
        const state = newStartedTestState();
        const {simidClient} = state;

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
        const {simidClient} = state;

        const duration = 123;
        const requestArgs = {duration};

        simidClient._playerConfig = {environmentData: {variableDurationAllowed: false}};
        await testClientReject(state, undefined, undefined,
            () => simidClient.requestChangeAdDuration(duration),
            SIMIDErrors.unspecifiedClientError, 'requestChangeAdDuration not allowed when variableDurationAllowed is false');

        simidClient._playerConfig = {environmentData: {variableDurationAllowed: true}};
        await testClientRequest(state, 'SIMID:Creative:requestChangeAdDuration', requestArgs,
            () => simidClient.requestChangeAdDuration(duration), undefined);
        await testClientReject(state, 'SIMID:Creative:requestChangeAdDuration', requestArgs,
            () => simidClient.requestChangeAdDuration(duration),
            SIMIDErrors.unspecifiedPlayerError, 'duration change rejected');
    });

    test('test requestChangeVolume', async () => {
        const state = newStartedTestState();
        const {simidClient} = state;

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
        const {simidClient} = state;

        simidClient._playerConfig = {environmentData: {fullscreenAllowed: false}};
        await testClientReject(state, undefined, undefined,
            () => simidClient.requestFullscreen(), SIMIDErrors.unspecifiedClientError, 'requestFullscreen not allowed when fullscreenAllowed is false');

        simidClient._playerConfig = {environmentData: {fullscreenAllowed: true}};
        await testClientRequest(state, 'SIMID:Creative:requestFullscreen', undefined,
            () => simidClient.requestFullscreen(), undefined);

        await testClientReject(state, 'SIMID:Creative:requestFullscreen', undefined,
            () => simidClient.requestFullscreen(), SIMIDErrors.unspecifiedPlayerError, 'requestFullscreen rejected');
    });

    test('test requestExitFullscreen', async () => {
        const state = newStartedTestState();
        const {simidClient} = state;

        simidClient._playerConfig = {environmentData: {fullscreenAllowed: false}};
        await testClientReject(state, undefined, undefined,
            () => simidClient.requestExitFullscreen(), SIMIDErrors.unspecifiedClientError, 'requestExitFullscreen not allowed when fullscreenAllowed is false');

        simidClient._playerConfig = {environmentData: {fullscreenAllowed: true}};
        await testClientRequest(state, 'SIMID:Creative:requestExitFullscreen', undefined,
            () => simidClient.requestExitFullscreen(), undefined);

        await testClientReject(state, 'SIMID:Creative:requestExitFullscreen', undefined,
            () => simidClient.requestExitFullscreen(), SIMIDErrors.unspecifiedPlayerError, 'requestExitFullscreen rejected');
    });

    test('test clickThru', async () => {
        const state = newStartedTestState();
        const {simidClient} = state;

        simidClient._playerConfig = {environmentData: {navigationSupport: 'adHandles'}};
        const callArgs = {
            x: 1, y: 2, uri: 'some uri'
        }
        const requestArgs = {
            ...callArgs,
            playerHandles: false
        }
        await testClientRequest(state, 'SIMID:Creative:clickThru', requestArgs,
            () => simidClient.clickThru(callArgs), undefined);

        simidClient._playerConfig = {environmentData: {navigationSupport: 'playerHandles'}};
        requestArgs.playerHandles = true;
        await testClientRequest(state, 'SIMID:Creative:clickThru', requestArgs,
            () => simidClient.clickThru(callArgs), undefined);

        await testClientReject(state, 'SIMID:Creative:clickThru', requestArgs,
            () => simidClient.clickThru(callArgs), SIMIDErrors.unspecifiedPlayerError, 'clickThru rejected');
    });

    test('test requestNavigation', async () => {
        const state = newStartedTestState();
        const {simidClient} = state;

        const uri = 'some uri';
        const requestArgs = {uri};

        await testClientRequest(state, 'SIMID:Creative:requestNavigation', requestArgs,
            () => simidClient.requestNavigation(uri), undefined);

        await testClientReject(state, 'SIMID:Creative:requestNavigation', requestArgs,
            () => simidClient.requestNavigation(uri), SIMIDErrors.unspecifiedPlayerError, 'requestNavigation rejected');
    });

    test('test requestPause', async () => {
        const state = newStartedTestState();
        const {simidClient} = state;

        simidClient._playerConfig = {environmentData: {variableDurationAllowed: false}};
        await testClientReject(state, undefined, undefined,
            () => simidClient.requestPause(),
            SIMIDErrors.unspecifiedClientError, 'requestPause not allowed when variableDurationAllowed is false');

        simidClient._playerConfig = {environmentData: {variableDurationAllowed: true}};
        await testClientRequest(state, 'SIMID:Creative:requestPause', undefined,
            () => simidClient.requestPause(), undefined);
        await testClientReject(state, 'SIMID:Creative:requestPause', undefined,
            () => simidClient.requestPause(),
            SIMIDErrors.unspecifiedPlayerError, 'requestPause rejected');
    });

    test('test requestPlay', async () => {
        const state = newStartedTestState();
        const {simidClient} = state;

        simidClient._playerConfig = {environmentData: {variableDurationAllowed: false}};
        await testClientReject(state, undefined, undefined,
            () => simidClient.requestPlay(),
            SIMIDErrors.unspecifiedClientError, 'requestPlay not allowed when variableDurationAllowed is false');

        simidClient._playerConfig = {environmentData: {variableDurationAllowed: true}};
        await testClientRequest(state, 'SIMID:Creative:requestPlay', undefined,
            () => simidClient.requestPlay(), undefined);
        await testClientReject(state, 'SIMID:Creative:requestPlay', undefined,
            () => simidClient.requestPlay(),
            SIMIDErrors.unspecifiedPlayerError, 'requestPlay rejected');
    });

    test('test requestSkip', async () => {
        const state = newStartedTestState();
        const {simidClient} = state;

        await testClientRequest(state, 'SIMID:Creative:requestSkip', undefined,
            () => simidClient.requestSkip(), undefined);
        await testClientReject(state, 'SIMID:Creative:requestSkip', undefined,
            () => simidClient.requestSkip(),
            SIMIDErrors.unspecifiedPlayerError, 'requestSkip rejected');
    });

    test('test requestStop', async () => {
        const state = newStartedTestState();
        const {simidClient} = state;

        simidClient.debug = true; // also see how things log

        await testClientRequest(state, 'SIMID:Creative:requestStop', undefined,
            () => simidClient.requestStop(), undefined);
        await testClientReject(state, 'SIMID:Creative:requestStop', undefined,
            () => simidClient.requestStop(),
            SIMIDErrors.unspecifiedPlayerError, 'requestStop rejected');
    });

    test('test media events', () => {
        const {player, simidClient, playerWindow} = newStartedTestState();

        function testEvent(event, args) {
            simidClient.onMediaEvent = mock.fn();

            const eventListener = mock.fn();
            simidClient.addEventListener(event, eventListener);

            player.sendPlayerMessage('SIMID:Media:' + event, args);
            assert.strictEqual(simidClient.onMediaEvent.mock.callCount(), 1);
            assert.deepStrictEqual(simidClient.onMediaEvent.mock.calls[0].arguments, [event, args]);

            const eventArgs = args || {};
            const expectedEvent = {...eventArgs, type: event};
            assert.strictEqual(eventListener.mock.callCount(), 1);
            assert.deepStrictEqual(eventListener.mock.calls[0].arguments, [expectedEvent]);

            // Verify event cleanup
            assert.ok(simidClient._eventListeners[event].indexOf(eventListener) >= 0);
            simidClient.removeEventListener(event, eventListener);
            assert.strictEqual(simidClient._eventListeners[event].indexOf(eventListener), -1);
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

function testPlayerRequest(state, type, args, waitForResponse) {
    const {player, playerWindow, simidClient} = state;

    const eventListener = mock.fn();
    const eventType = simidClient._getEventType(type);
    if (eventListener) {
        simidClient.addEventListener(eventType, eventListener);
    }

    const requestMsg = player.sendPlayerMessage(type, args);

    if (waitForResponse) {
        return waitForResponse().then(verifyResponse);
    } else {
        verifyResponse();
        return;
    }

    function verifyResponse() {
        const lastMsg = playerWindow.lastMessage;
        assert.strictEqual(lastMsg.type, 'resolve');
        assert.strictEqual(lastMsg.args.messageId, requestMsg.messageId);
        assert.strictEqual(lastMsg.args.value, undefined);

        if (eventListener) {
            const eventData = args || {};
            const expectedEvent = {...eventData, type: eventType};
            assert.strictEqual(eventListener.mock.callCount(), 1);
            assert.deepStrictEqual(eventListener.mock.calls[0].arguments, [expectedEvent]);

            // Verify event cleanup
            if (simidClient.isStopped) {
                assert.deepStrictEqual(simidClient._eventListeners, {});
            } else {
                assert.ok(simidClient._eventListeners[eventType].indexOf(eventListener) >= 0);
                simidClient.removeEventListener(eventType, eventListener);
                assert.strictEqual(simidClient._eventListeners[eventType].indexOf(eventListener), -1);
            }
        }
    }
}

function testPlayerReject(state, type, args, errorCode, errMessage) {
    const { player, playerWindow } = state;
    const requestMsg = player.sendPlayerMessage(type, args);
    assert.strictEqual(playerWindow.lastMessage.type, 'reject');
    assert.strictEqual(playerWindow.lastMessage.args.messageId, requestMsg.messageId);
    assert.deepStrictEqual(playerWindow.lastMessage.args.value, {errorCode, message: errMessage});
}

async function testClientRequest(state, type, expectedArgs, requestAction, requestResult) {
    const { player, playerWindow, adWindow } = state;
    playerWindow.lastMessage = undefined;
    adWindow.lastMessage = undefined;

    const requestPromise = requestAction();

    const clientMsg = playerWindow.lastMessage;
    assert.notStrictEqual(clientMsg, null);
    assert.strictEqual(clientMsg.type, type);
    assert.deepStrictEqual(clientMsg.args, expectedArgs);

    player.resolveClientRequest(clientMsg, requestResult);

    const result = await requestPromise;
    assert.deepEqual(result, requestResult);

    const resolveMsg = adWindow.lastMessage;
    assert.notStrictEqual(resolveMsg, null);
    assert.strictEqual(resolveMsg.type, 'resolve');

    // because resolvedMsg will be pushed via postMessage ( i.e., json serialization )
    // properties with `undefined` as a value will be omitted from the resolvedMsg
    // `JSON.stringify({ a: undefined, b: 'super' }); // will output {"b":"super"}`
    const expectedResolvedArgs = JSON.parse(JSON.stringify(
        { messageId: clientMsg.messageId, value: requestResult }
    ));

    assert.deepStrictEqual(resolveMsg.args, expectedResolvedArgs);
}

async function testClientReject(state, type, expectedArgs, requestAction, errorCode, errMessage) {
    const { player, playerWindow, adWindow } = state;
    playerWindow.lastMessage = undefined;
    adWindow.lastMessage = undefined;

    const requestPromise = requestAction();

    const clientMsg = playerWindow.lastMessage;

    if (!type) {
        // Expect no message to have been sent.
        // Instead, the client should have rejected locally.
        assert.strictEqual(clientMsg, undefined);
    } else {
        player.rejectClientRequest(clientMsg, errorCode, errMessage);
    }

    try {
        await requestPromise;
        assert.fail('Expected promise to reject');
    } catch (err) {
        assert.strictEqual(err.errorCode, errorCode);
        assert.strictEqual(err.message, errMessage);
        assert.partialDeepStrictEqual(err.clientRequest, clientMsg);
    }

    if (type) {
        const resolveMsg = adWindow.lastMessage;
        assert.notStrictEqual(resolveMsg, null);
        assert.strictEqual(resolveMsg.type, 'reject');
        assert.partialDeepStrictEqual(resolveMsg.args, {
            messageId: clientMsg.messageId,
            value: { errorCode, message: errMessage }
        });
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
        if (type === 'message') {
            this.onPostMessage = listener;
        }
    }

    removeEventListener(type, listener) {
        if (type === 'message' && this.onPostMessage === listener) {
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
        if (!eventData || typeof eventData !== 'string') return;

        const message = JSON.parse(eventData);
        const { sessionId, messageId, type } = message;
        if (!sessionId || isNaN(messageId) || !type) return;

        if (type === 'createSession') {
            this.sessionId = sessionId;
        }
    }

    resolveClientRequest(clientMsg, value) {
        this.sendPlayerMessage('resolve', { messageId: clientMsg.messageId, value });
    }

    rejectClientRequest(clientMsg, errorCode, errMessage) {
        this.sendPlayerMessage('reject', { messageId: clientMsg.messageId, value: { errorCode, message: errMessage }});
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
