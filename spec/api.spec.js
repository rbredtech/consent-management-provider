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

describe("Consent Management is loaded", () => {
    let first;
    beforeAll(async () => {
        const loaderLoaded = page.waitForResponse(response => response.url()
            .includes('loader.js'));
        const managerLoaded = pageHelper.initLoader(page);
        await loaderLoaded;
        const apiResponse = page.evaluate(`(new Promise((resolve)=>{window.__tcfapi('getTCData', 1, resolve)}))`);
        first = await Promise.race([managerLoaded, apiResponse])
    });

    test("Manager is loaded before API is available", () => {
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

                window.__tcfapi('log', 1, add);
            });
        });

        describe("And API method is called", () => {
           beforeAll(async () => {
               const apiResponse = page.evaluate(`(new Promise((resolve)=>{window.__tcfapi('getTCData', 1, resolve)}))`);
               await apiResponse;
           });

           test("Activity is logged", async () => {
              const queue = await page.evaluate(() => { return window.callbackQueue; });
              expect(queue).toHaveLength(1);
              expect(queue[0]).toEqual(['getTCData', 'disabled', null])
           });

            describe("And API method is called again", () => {
                beforeAll(async () => {
                    const apiResponse = page.evaluate(`(new Promise((resolve)=>{window.__tcfapi('getTCData', 1, resolve)}))`);
                    await apiResponse;
                });

                test("Activity is logged", async () => {
                    const queue = await page.evaluate(() => { return window.callbackQueue; });
                    expect(queue).toHaveLength(2);
                    expect(queue[1]).toEqual(['getTCData', 'disabled', null])
                });
            });
        });
    });
});
