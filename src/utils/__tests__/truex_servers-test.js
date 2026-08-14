import { describe, test } from 'node:test';
import assert from 'node:assert';
import { isTruexProductionUrl, TruexServers } from '../truex_servers.js';

describe("truex_servers testing", () => {
    test("isTruexProductionUrl", () => {
        assert.strictEqual(isTruexProductionUrl(), false);
        assert.strictEqual(isTruexProductionUrl("127.0.0.1"), false);
        assert.strictEqual(isTruexProductionUrl("http://localhost:8080"), false);
        assert.strictEqual(isTruexProductionUrl("http://media.truex.com"), true);
        assert.strictEqual(isTruexProductionUrl("https://media.truex.com"), true);
        assert.strictEqual(isTruexProductionUrl("https://measure.truex.com"), true);
        assert.strictEqual(isTruexProductionUrl("https://server.truex.com"), true);
        assert.strictEqual(isTruexProductionUrl("http://qa-media.truex.com"), false);
        assert.strictEqual(isTruexProductionUrl("https://qa-media.truex.com"), false);
        assert.strictEqual(isTruexProductionUrl("https://qa-server.truex.com"), false);
        assert.strictEqual(isTruexProductionUrl("https://media.somewhere.else.com"), false);
        assert.strictEqual(isTruexProductionUrl("https://qa-rtb-tf.truex.com"), false);

        assert.strictEqual(isTruexProductionUrl("qa-media.truex.com"), false);
        assert.strictEqual(isTruexProductionUrl("media.truex.com"), true);

        assert.strictEqual(isTruexProductionUrl("http://engage.truex.com"), true);
        assert.strictEqual(isTruexProductionUrl("http://qa-engage.truex.com"), false);
    });

    test("truex servers", () => {
        verifyServers(new TruexServers(false), false);
        verifyServers(new TruexServers(true), true);
        verifyServers(new TruexServers(), false);
        verifyServers(new TruexServers(null), false);
        verifyServers(new TruexServers({}), false);

        const hiltonAd = "https://qa-get.truex.com/15c7f5269a09bd8c5007ba98263571dd80c458e5/vast/config?dimension_2=0&dimension_5=hilton&stream_position=preroll&stream_id=1234";
        verifyServers(new TruexServers(hiltonAd), false);

        const multiVideosProd = "https://get.truex.com/72904fe382372efcdcea6314aa1d7a37db6051b9/vast/config?dimension_1=#e{series.title}&dimension_2=#{slot.position}&dimension_3=#e{asset.title}&dimension_4=#e{asset.id}&dimension_5=truex_sold&stream_position=midroll&stream_id=#{request.videoRandom}";
        verifyServers(new TruexServers(multiVideosProd), true);

        const qaConfig = {ads: [{window_url: "https://qa-media.truex.com/container/3.x/current/desktop/?whatever=1234"}]}
        verifyServers(new TruexServers(qaConfig), false);

        const prodConfig = {ads: [{window_url: "https://media.truex.com/container/3.x/current/desktop/?whatever=1234"}]}
        verifyServers(new TruexServers(prodConfig), true);

        const skipCardConfig = {ads: [], "card_creative_url": "https://media.truex.com/integration/ctv/choicecard-ctv.js"};
        verifyServers(new TruexServers(skipCardConfig), true);

        const skipCardConfig2 = {ads: [], "card_creative_url": "https://qa-media.truex.com/integration/ctv/choicecard-ctv.js"};
        verifyServers(new TruexServers(skipCardConfig2), false);

        const demoConfig = {ads: [], "service_url": "measure.truex.com"};
        verifyServers(new TruexServers(demoConfig), true);

        function verifyServers(servers, isProd) {
            assert.strictEqual(servers.isProduction, isProd);

            assert.strictEqual(servers.serverUrlOf("something.elsewhere.com"), "https://something.elsewhere.com");
            assert.strictEqual(servers.serverUrlOf("http://localhost:8080"), "http://localhost:8080");
            assert.strictEqual(servers.serverUrlOf("qa-media.truex.com"), "https://qa-media.truex.com");
            assert.strictEqual(servers.serverUrlOf("//qa-media.truex.com"), "https://qa-media.truex.com");
            assert.strictEqual(servers.serverUrlOf("http://qa-media.truex.com"), "http://qa-media.truex.com");
            assert.strictEqual(servers.serverUrlOf("https://qa-media.truex.com"), "https://qa-media.truex.com");

            if (isProd) {
                assert.strictEqual(servers.truexServerUrl, "https://serve.truex.com");
                assert.strictEqual(servers.mediaServerUrl, "https://media.truex.com");
                assert.strictEqual(servers.measureServerUrl, "https://measure.truex.com");
                assert.strictEqual(servers.engageServerUrl, "https://engage.truex.com");
                assert.strictEqual(servers.serverUrlOf("something.truex.com"), "https://something.truex.com");
                assert.strictEqual(servers.qrCodeServerUrl, "https://qr.truex.com");
            } else {
                assert.strictEqual(servers.truexServerUrl, "https://qa-serve.truex.com");
                assert.strictEqual(servers.mediaServerUrl, "https://qa-media.truex.com");
                assert.strictEqual(servers.measureServerUrl, "https://qa-measure.truex.com");
                assert.strictEqual(servers.engageServerUrl, "https://qa-engage.truex.com");
                assert.strictEqual(servers.qrCodeServerUrl, "https://qa-qr.truex.com");
                assert.strictEqual(servers.serverUrlOf("something.truex.com"), "https://qa-something.truex.com");
            }
        }
    });
});
