import { SIMIDClient, SIMIDDimensions, SIMIDMessage } from '../simid-client';

jest.useFakeTimers();

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

    test('test ad stopped', () => {
        const state = newStartedTestState();
        const { simidClient } = state;
        expect(simidClient.isActive).toBe(true);

        simidClient.onAdStopped = jest.fn();
        testPlayerRequest(state, 'SIMID:Player:adStopped');
        expect(simidClient.isActive).toBe(false);
        expect(simidClient.onAdStopped).toHaveBeenCalled();
    });

    test('test logging', () => {
        const { player, simidClient, playerWindow } = newStartedTestState();

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

    test('test background/foreground', () => {
        const { player, simidClient } = newStartedTestState();

        simidClient.onAdBackgrounded = jest.fn();
        player.sendPlayerMessage('SIMID:Player:adBackgrounded');
        expect(simidClient.onAdBackgrounded).toHaveBeenCalled();

        simidClient.onAdForegrounded = jest.fn();
        player.sendPlayerMessage('SIMID:Player:adForegrounded');
        expect(simidClient.onAdForegrounded).toHaveBeenCalled();
    });

    test('test player fatalError', () => {
        const { player, simidClient } = newStartedTestState();

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

    test('test media events', () => {
        const { player, simidClient, playerWindow } = newStartedTestState();;

        function testEvent(event, args) {
            simidClient.onMediaEvent = jest.fn();
            player.sendPlayerMessage('SIMID:Media:' + event, args);
            expect(simidClient.onMediaEvent).toHaveBeenCalledWith(event, args);
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

function testPlayerRequest(state, type, args) {
    const { player, playerWindow } = state;
    const requestMsg = player.sendPlayerMessage(type, args);
    expect(playerWindow.lastMessage).toEqual(expect.objectContaining({type: 'resolve', args: {messageId: requestMsg.messageId, value: undefined}}));
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

    postMessage(msg, domain) {
        const msgJson = JSON.stringify(msg);
        const msgCopy = JSON.parse(msgJson);

        // For debugging
        //console.log(`${this.id}.postMessage: ${msg.messageId} ${msg.type}`);

        this.lastMessage = msgCopy;
        if (!this.onPostMessage) return;
        this.onPostMessage({data: msgCopy})
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
        this.adWindow.postMessage(msg, '*');
        return msg;
    }

    onPostMessage(event) {
        const data = event.data;
        if (!data) return;
        const {sessionId, messageId, type, args} = data;
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
    jest.runOnlyPendingTimers();
    state.simidClient._pendingClientRequests = {};
    state.player.sessionId = state.simidClient._sessionId;
    return state;
}
