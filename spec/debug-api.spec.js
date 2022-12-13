const { describe, beforeAll, test, expect, afterAll } = require("@jest/globals");
const pageHelper = require("./helper/page");
const { wait } = require("../helper/util");

let page;

beforeAll(async () => {
  page = await pageHelper.get();
}, 20000);

afterAll(async () => {
  await page.browser().close();
}, 20000);

describe("Debug API", () => {
  beforeAll(async () => {
    const pageLoaded = page.waitForNavigation({ waitUntil: "networkidle0" });
    await pageHelper.initLoader(page);
    await pageLoaded;
  });

  describe("When debug listener is subscribed", () => {
    beforeAll(async () => {
      await page.evaluate(() => {
        return new Promise((resolve) => {
          window.callbackQueue = [];

          function add(params) {
            window.callbackQueue.push(params);
          }

          window.__tcfapi("onLogEvent", 2, add);
          resolve();
        });
      });
      await wait(100);
    });

    describe("And getTCData API method is called", () => {
      beforeAll(async () => {
        const apiResponse = page.evaluate(`(new Promise((resolve)=>{window.__tcfapi('getTCData', 1, resolve)}))`);
        await apiResponse;
      });

      test("Load event is logged", async () => {
        const queue = await page.evaluate(() => {
          return window.callbackQueue;
        });
        expect(queue).toHaveLength(2);
        expect(queue[0]).toEqual({
          event: "loaded",
          parameters: { type: "iframe" },
          success: true,
          ts: expect.any(Number),
        });
      });

      test("Activity for getTCData is logged", async () => {
        const queue = await page.evaluate(() => {
          return window.callbackQueue;
        });
        expect(queue).toHaveLength(2);
        expect(queue[1]).toEqual({
          event: "TCData",
          parameters: { status: "disabled" },
          success: true,
          ts: expect.any(Number),
        });
      });

      describe("And setConsent API method is called again", () => {
        let consentCookieLoaded;

        beforeAll(async () => {
          consentCookieLoaded = page.waitForResponse((response) => response.url().includes("set-consent"));
          await page.evaluate(`(new Promise((resolve)=>{window.__tcfapi('setConsent', 1, resolve, false)}))`);
          await consentCookieLoaded;
          await wait(100);
        });

        test("Activity for setConsent is logged", async () => {
          const queue = await page.evaluate(() => {
            return window.callbackQueue;
          });
          expect(queue).toHaveLength(3);
          expect(queue[2]).toEqual({
            event: "setConsent",
            parameters: {
              consent: "false",
              localStorageAvailable: true,
            },
            success: true,
            ts: expect.any(Number),
          });
        });
      });
    });
  });
});
