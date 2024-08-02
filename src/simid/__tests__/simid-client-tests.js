import { SIMIDClient, SIMIDMessage } from '../simid-client';

jest.useFakeTimers();

describe('test simid client', () => {

    test('start/stop simid client', async () => {
        const { player, simidClient, playerWindow, adWindow } = newTestState();
        expect(simidClient._sessionId).toBeUndefined()

        player.sendPlayerMessage('test', {});
        expect(playerWindow.lastMessage).toBeUndefined();
        expect(simidClient.isActive).toBe(false);

        jest.runOnlyPendingTimers();

        expect(adWindow.lastMessage.type).toBe('test');

        const startPromise = simidClient.start();

        jest.runOnlyPendingTimers();

        expect(simidClient.isActive).toBe(true);
        expect(simidClient._sessionId).toBeDefined();
        let clientMsg = playerWindow.lastMessage;
        expect(clientMsg).toEqual(expect.objectContaining(
            { sessionId: simidClient._sessionId, messageId: 0, type: 'createSession', args: {} }));
        expect(clientMsg?.timestamp).toBeLessThanOrEqual(Date.now());
        expect(player.sessionId).toEqual(simidClient._sessionId);


        // Acknowledge the createSession
        player.resolveClientRequest(clientMsg);

        jest.runOnlyPendingTimers();

        await startPromise;
        expect(adWindow.lastMessage.type).toBe('resolve');

        // Ensure no message processing if not active.
        playerWindow.lastMessage = undefined;
        simidClient.stop();

        player.sendPlayerMessage('SIMID:Player:init', { });
        jest.runOnlyPendingTimers();
        expect(playerWindow.lastMessage).toBeUndefined();
    });

    test('test initial ad flow', async () => {
        const state = newTestState();
        const { player, simidClient, playerWindow, adWindow } = state;

        simidClient.start();
        jest.runOnlyPendingTimers();

        // Acknowledge the createSession
        expect(playerWindow.lastMessage.type).toBe('createSession');
        player.resolveClientRequest(playerWindow.lastMessage);
        jest.runOnlyPendingTimers();
        jest.runOnlyPendingTimers();

        testPlayerRequest(state, 'SIMID:Player:init', { });
        testPlayerRequest(state, 'SIMID:Player:startCreative', { });
    });

    test('test ad skipped', async () => {
        const state = newStartedTestState();
        const { simidClient } = state;
        expect(simidClient.isActive).toBe(true);

        simidClient.onAdSkipped = jest.fn();
        testPlayerRequest(state, 'SIMID:Player:adSkipped');
        expect(simidClient.isActive).toBe(false);
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

        console.log(`${this.id}.postMessage: ${msg.messageId} ${msg.type}`);

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
