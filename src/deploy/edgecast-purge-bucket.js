const p = require("path");
const Edgecast = require("edgecast-purge");

module.exports = (bucket, path, edgeCastToken, edgeCastCustomerId) => {
    const edgecastService = new Edgecast(edgeCastToken, edgeCastCustomerId);
    const pathsToPurge = [];
    const protocols = ["http://", "https://"];

    protocols.forEach((protocol) => {
        const pathToPurge = `${protocol}${p.join(bucket, `${path}/*`)}`;
        logger.info(`purging path ${pathToPurge}`);
        pathsToPurge.push(pathToPurge);
    });

    return edgecastService.purge(pathsToPurge);
};
