const {
    describe,
    beforeAll,
    afterAll,
    test,
    expect
} = require("@jest/globals");
const pageHelper = require("./helper/page");
let page;

beforeAll(async () => {
    page = await pageHelper.get();
}, 20000);

afterAll(async () => {
    await page.browser()
        .close();
}, 20000);

describe("Consent Management API", () => {
    let first;
    beforeAll(async () => {
        const loaderLoaded = page.waitForResponse(response => response.url()
            .includes('loader.js'));
        const managerLoaded = pageHelper.initLoader(page);
        await loaderLoaded;
        const apiResponse = page.evaluate(`(new Promise((resolve)=>{window.__tcfapi('getTCData', 1, resolve)}))`);
        first = await Promise.race([managerLoaded, apiResponse])
    });

    test("Is available", () => {
        expect(first.url())
            .toContain("manager-iframe.js");
    });

    describe("When debug listener is subscribed",() => {
        beforeAll(async () => {
            await page.evaluate(() => {
                window.callbackQueue = [];

                function add(params) {
                    callbackQueue.push(params);
                };

                window.__tcfapi('onLogEvent', 1, add);
            });
        });

        test("Load event is logged", async () => {
            const queue = await page.evaluate(() => { return window.callbackQueue; });
            expect(queue).toHaveLength(2);
            expect(queue[1]).toEqual({"event": "loaded", "parameters": {"type": "iframe"}, "success": true, ts: expect.any(Number)})
        });

        describe("And API method is called", () => {
           beforeAll(async () => {
               const apiResponse = page.evaluate(`(new Promise((resolve)=>{window.__tcfapi('getTCData', 1, resolve)}))`);
               await apiResponse;
           });

           test("Activity is logged", async () => {
              const queue = await page.evaluate(() => { return window.callbackQueue; });
              expect(queue).toHaveLength(3);
              expect(queue[2]).toEqual({"event": "TCData", "parameters": {"status": "disabled"}, "success": true, ts: expect.any(Number)})
           });

            describe("And API method is called again", () => {
                beforeAll(async () => {
                    const apiResponse = page.evaluate(`(new Promise((resolve)=>{window.__tcfapi('getTCData', 1, resolve)}))`);
                    await apiResponse;
                });

                test("Activity is logged", async () => {
                    const queue = await page.evaluate(() => { return window.callbackQueue; });
                    expect(queue).toHaveLength(4);
                    expect(queue[3]).toEqual({"event": "TCData", "parameters": {"status": "disabled"}, "success": true, ts: expect.any(Number)})
                });
            });
        });
    });
});
