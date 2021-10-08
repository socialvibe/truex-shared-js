import { isTruexProductionUrl, TruexServers } from '../truex_servers';

describe("truex_servers testing", () => {
    test("isTruexProductionUrl", () => {
        expect(isTruexProductionUrl()).toBe(false);
        expect(isTruexProductionUrl("127.0.0.1")).toBe(false);
        expect(isTruexProductionUrl("http://localhost:8080")).toBe(false);
        expect(isTruexProductionUrl("http://media.truex.com")).toBe(true);
        expect(isTruexProductionUrl("https://media.truex.com")).toBe(true);
        expect(isTruexProductionUrl("https://measure.truex.com")).toBe(true);
        expect(isTruexProductionUrl("https://server.truex.com")).toBe(true);
        expect(isTruexProductionUrl("http://qa-media.truex.com")).toBe(false);
        expect(isTruexProductionUrl("https://qa-media.truex.com")).toBe(false);
        expect(isTruexProductionUrl("https://qa-server.truex.com")).toBe(false);
        expect(isTruexProductionUrl("https://media.somewhere.else.com")).toBe(false);
    });

    test("truex servers", () => {
        const hiltonAd = "https://qa-get.truex.com/15c7f5269a09bd8c5007ba98263571dd80c458e5/vast/config?dimension_2=0&dimension_5=hilton&stream_position=preroll&stream_id=1234";
        verifyServers(new TruexServers(hiltonAd), false);

        const multiVideosProd = "https://get.truex.com/72904fe382372efcdcea6314aa1d7a37db6051b9/vast/config?dimension_1=#e{series.title}&dimension_2=#{slot.position}&dimension_3=#e{asset.title}&dimension_4=#e{asset.id}&dimension_5=truex_sold&stream_position=midroll&stream_id=#{request.videoRandom}";
        verifyServers(new TruexServers(multiVideosProd), true);

        const qaConfig = {ads: [{window_url: "https://qa-media.truex.com/container/3.x/current/desktop/?whatever=1234"}]}
        verifyServers(new TruexServers(qaConfig), false);

        const prodConfig = {ads: [{window_url: "https://media.truex.com/container/3.x/current/desktop/?whatever=1234"}]}
        verifyServers(new TruexServers(prodConfig), true);

        function verifyServers(servers, isProd) {
            expect(servers.isProduction).toBe(isProd);

            expect(servers.serverUrlOf("something.elsewhere.com")).toBe("https://something.elsewhere.com");
            expect(servers.serverUrlOf("http://localhost:8080")).toBe("http://localhost:8080");

            if (isProd) {
                expect(servers.truexServerUrl).toBe("https://serve.truex.com");
                expect(servers.mediaServerUrl).toBe("https://media.truex.com");
                expect(servers.measureServerUrl).toBe("https://measure.truex.com");
                expect(servers.serverUrlOf("something.truex.com")).toBe("https://something.truex.com");
            } else {
                expect(servers.truexServerUrl).toBe("https://qa-serve.truex.com");
                expect(servers.mediaServerUrl).toBe("https://qa-media.truex.com");
                expect(servers.measureServerUrl).toBe("https://qa-measure.truex.com");
                expect(servers.serverUrlOf("something.truex.com")).toBe("https://qa-something.truex.com");
            }
        }
    });
});