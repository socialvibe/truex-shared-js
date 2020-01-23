/**
 * Describes logical input actions or virtual keys that represent user inputs in a platform independent way.
 *
 * In particular, these allow the developer to not have to know the platform specific remote control key event codes.
 */
export const inputActions = {
    moveUp: "moveUp",
    moveDown: "moveDown",
    moveLeft: "moveLeft",
    moveRight: "moveRight",

    select: "select",
    back: "back",
    menu: "menu",
    exit: "exit",
    search: "search",
    home: "home",

    num0: "0",
    num1: "1",
    num2: "2",
    num3: "3",
    num4: "4",
    num5: "5",
    num6: "6",
    num7: "7",
    num8: "8",
    num9: "9",

    // Usually play/pause is just a toggle.
    playPause: "playPause",
    fastForward: "fastForward",
    rewind: "rewind",
    seek: "seek",
    stop: "stop",

    nextTrack: "nextTrack",
    prevTrack: "prevTack",

    // Present on some remotes, e.g. LG, Tizen
    red: "red",
    green: "green",
    yellow: "yellow",
    blue: "blue",

    extra: "extra", // on Tizen 2016 remote

    // Playstation controller
    buttonX: "buttonX", // also XBox, and for that matter Nintendo, but with a different meaning
    buttonSquare: "buttonSquare",
    buttonCircle: "buttonCircle",
    buttonTriangle: "buttonTriangle",

    // Xbox controller
    buttonA: "buttonA",
    buttonB: "buttonB",
    buttonY: "buttonY",

    // Common console shoulder buttons
    leftShoulder1: "leftShoulder1",
    leftShoulder2: "leftShoulder2",
    rightShoulder1: "rightShoulder1",
    rightShoulder2: "rightShoulder2",
    leftStick: "leftStick", // i.e. the "click" of pressing down on the stick
    rightStick: "rightStick",

    // Common console Media remote actions
    skipForward: "skipForward",
    skipBackward: "skipBackward",
    info: "info",

    isMovementAction(action) {
        return /^move/.test(action);
    },

    isUpDownAction(action) {
        return action == this.moveUp || action == this.moveDown;
    },

    isLeftRightAction(action) {
        return action == this.moveLeft || action == this.moveRight;
    },
};

export default inputActions;
