const { describe, beforeAll, afterAll, test, expect } = require("@jest/globals");
const pageHelper = require("./helper/page");
let page;

beforeAll(async () => {
    page = await pageHelper.get();
}, 20000);


afterAll(async () => {
    await page.browser().close();
}, 20000);

describe("Consent Management with vewd user agent", () => {
    beforeAll(async () => {
        await page.setUserAgent("useragent VeWd1.2 version")
        await page.goto(`http://${pageHelper.HTTP_HOST}/health`);
        await page.evaluate(`localStorage.setItem("xt", "${Date.now() - 3600000 * 49}");`);
    });

    describe("Is loaded", () => {
        beforeAll(async () => {
            await pageHelper.initLoader(page);
        });

        test("Storage status is enabled and consent is false", async () => {
            const apiResponse = await page.evaluate(`(new Promise((resolve)=>{window.__tcfapi('getTCData', 2, resolve)}))`);

            expect(apiResponse.cmpStatus)
                .toBe("disabled");
            expect(apiResponse.vendor["consents"]).toBeDefined();
            expect(apiResponse.vendor["consents"]["4040"])
                .toBeUndefined()
        });
    });
});
