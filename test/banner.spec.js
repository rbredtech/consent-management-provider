const {
    describe,
    beforeAll,
    afterAll,
    test,
    expect
} = require("@jest/globals");
const pageHelper = require("./helper/page");
const exp = require("constants");
let page;

beforeAll(async () => {
    page = await pageHelper.get();
}, 20000);

afterAll(async () => {
    await page.browser()
        .close();
}, 20000);

describe("Consent Management with banner", () => {
    beforeAll(async () => {
        await page.goto(`http://${pageHelper.HTTP_HOST}/health`);
        await page.evaluate(`localStorage.setItem("xt", "${Date.now() - 3600000 * 49}");`);
    });

    describe("Is loaded", () => {
        let iframe;
        beforeAll(async () => {
            await pageHelper.initLoader(page, 0, true);
            iframe = (await page.frames()).find(frame => frame.url()
                .indexOf("iframe") > -1);
        });

        test("Banner pop-up is NOT displayed", () => {
            expect(iframe.waitForSelector("div#agttcnstbnnr", {
                visible: true,
                timeout: 10
            })).rejects.toBeDefined()
        });

        describe("When showBanner API method is called", () => {
            beforeAll(() => {
                page.evaluate(`(new Promise((resolve)=>{window.__tcfapi('showBanner', 2, resolve)}))`);
            });

            test("Banner pop-up is displayed", async () => {
                expect(await iframe.waitForSelector("div#agttcnstbnnr", {
                    visible: true,
                    timeout: 1000
                }))
                    .toBeDefined();
            });

            test("Channel Name is replaced in legal text", async () => {
                expect(await iframe.$eval("div#agttcnstbnnr", node => node.innerText)).toContain("ServusTV");
            });
        });
    });
});
