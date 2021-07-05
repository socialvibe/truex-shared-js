
var startTime = Date.now();

export function resetTraceStart(newValue = Date.now()) {
    startTime = newValue;
}

export function elapsedTrace(msg) {
    const elapsed = (Date.now() - startTime) / 1000;
    console.log(`*** ${elapsed.toFixed(3)}s: ${msg}`);
}

export function timedTrace(msg) {
    const now = new Date();
    const time = now.toISOString().split('T')[1].replace(/Z$/, '');
    console.log(`*** ${time}: ${msg}`);
}

export default timedTrace;
