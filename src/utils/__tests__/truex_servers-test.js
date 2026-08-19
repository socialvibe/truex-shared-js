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

        const qaConfig = {
            service_url: "qa-measure.truex.com",
            ads: [{window_url: "https://qa-media.truex.com/container/3.x/current/desktop/?whatever=1234"}]
        };
        verifyServers(new TruexServers(qaConfig), false);

        const prodConfig = {
            service_url: "measure.truex.com",
            ads: [{window_url: "https://media.truex.com/container/3.x/current/desktop/?whatever=1234"}]
        };
        verifyServers(new TruexServers(prodConfig), true);

        const prodServiceConfig = {
            ads: [],
            service_url: "measure.truex.com",
            card_creative_url: "https://qa-media.truex.com/free-form-input.js"
        };
        verifyServers(new TruexServers(prodServiceConfig), true);

        const qaServiceConfig = {
            ads: [],
            service_url: "qa-measure.truex.com",
            card_creative_url: "https://media.truex.com/free-form-input.js"
        };
        verifyServers(new TruexServers(qaServiceConfig), false);

        function verifyServers(servers, isProd) {
            assert.strictEqual(servers.isProduction, isProd);
            assert.strictEqual(servers.env, isProd ? 'prod' : 'qa');

            if (isProd) {
                assert.strictEqual(servers.rtbServerUrl, "https://qa.truex.com");
                assert.strictEqual(servers.truexServerUrl, "https://serve.truex.com");
                assert.strictEqual(servers.mediaServerUrl, "https://media.truex.com");
                assert.strictEqual(servers.measureServerUrl, "https://measure.truex.com");
                assert.strictEqual(servers.engageServerUrl, "https://engage.truex.com");
                assert.strictEqual(servers.qrCodeServerUrl, "https://qr.truex.com");
                assert.strictEqual(servers.eeServerUrl, "https://ee.truex.com");
            } else {
                assert.strictEqual(servers.rtbServerUrl, "https://qa-qa.truex.com");
                assert.strictEqual(servers.truexServerUrl, "https://qa-serve.truex.com");
                assert.strictEqual(servers.mediaServerUrl, "https://qa-media.truex.com");
                assert.strictEqual(servers.measureServerUrl, "https://qa-measure.truex.com");
                assert.strictEqual(servers.engageServerUrl, "https://qa-engage.truex.com");
                assert.strictEqual(servers.qrCodeServerUrl, "https://qa-qr.truex.com");
                assert.strictEqual(servers.eeServerUrl, "https://qa-ee.truex.com");
            }
        }
    });
});
