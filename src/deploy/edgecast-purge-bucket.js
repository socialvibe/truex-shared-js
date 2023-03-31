const p = require("path");
const Edgecast = require("edgecast-purge");

// This is no longer needed in practice, as we have migrated away from Edgecast, and are now using Fastly CDN.
// It remains here for reference purposes.

module.exports = (bucket, path, edgeCastToken, edgeCastCustomerId) => {
    const edgecastService = new Edgecast(edgeCastToken, edgeCastCustomerId);
    const pathsToPurge = [];
    const protocols = ["http://", "https://"];

    protocols.forEach((protocol) => {
        const pathToPurge = `${protocol}${p.join(bucket, `${path}/*`)}`;
        console.log(`purging path ${pathToPurge}`);
        pathsToPurge.push(pathToPurge);
    });

    return edgecastService.purge(pathsToPurge);
};
