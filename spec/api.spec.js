const { describe, beforeAll, afterAll, test, expect } = require("@jest/globals");
const pageHelper = require("./helper/page");
let page;

beforeAll(async () => {
    page = await pageHelper.get();
}, 20000);


afterAll(async () => {
    await page.browser().close();
}, 20000);

describe("API is called right after loading", () => {
    let apiResponse;
    beforeAll( async () => {
        const pageLoaded = page.waitForNavigation({waitUntil: 'load'});
        pageHelper.initLoader(page);
        await pageLoaded.then(() => {
            apiResponse = page.evaluate(`(new Promise((resolve)=>{window.__tcfapi('getTCData', 1, resolve)}))`);
        });
    });

    test("Callback is eventually called", async () => {
        expect(await apiResponse)
            .toBeDefined();
        expect(await apiResponse).toHaveProperty('vendor')
        expect(await apiResponse).toHaveProperty('cmpStatus')
    });
});
