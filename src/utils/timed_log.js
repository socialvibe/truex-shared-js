export function timedLog(msg) {
    const time = new Date().toISOString().split('T')[1].replace(/Z$/, '');
    console.log(`*** ${time}: ${msg}`);
}

export default timedLog;
