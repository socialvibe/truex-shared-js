
var startTime = Date.now();
var lastTime = startTime;

/**
 * @param {number} [newValue]
 */
export function resetTraceStart(newValue = Date.now()) {
    startTime = newValue;
}

/**
 * @param {string} msg
 */
export function elapsedTrace(msg) {
    const now = Date.now();
    const elapsed = (now - startTime) / 1000;
    const sinceLast = now - lastTime;
    lastTime = now;
    console.log(`*** ${elapsed.toFixed(3)}s (${sinceLast}): ${msg}`);
}

/**
 * @param {string} msg
 */
export function timedTrace(msg) {
    const now = new Date();
    const time = now.toISOString().split('T')[1].replace(/Z$/, '');
    console.log(`*** ${time}: ${msg}`);
}

export default timedTrace;
