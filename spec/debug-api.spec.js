const { describe, beforeAll, expect, afterAll, it } = require("@jest/globals");
const pageHelper = require("./helper/page");
const { wait } = require("./helper/wait");

let page;

beforeAll(async () => {
  page = await pageHelper.get();
}, 20000);

afterAll(async () => {
  await page.browser().close();
}, 20000);

describe("Debug API", () => {
  beforeAll(async () => {
    await page.goto(`${pageHelper.HTTP_PROTOCOL}://${pageHelper.HTTP_HOST}/health`);
    await pageHelper.initLoader(page);
  });

  describe("when debug listener is subscribed", () => {
    beforeAll(async () => {
      await page.evaluate(() => {
        return new Promise((resolve) => {
          window.callbackQueue = [];
          window.__tcfapi("addLogEventListener", 2, function (params) {
            window.callbackQueue.push(params);
          });
          resolve();
        });
      });
      await wait(100);
    });

    describe("and getTCData API method is called", () => {
      beforeAll(async () => {
        await page.evaluate(() => {
          return new Promise((resolve) => {
            window.__tcfapi("getTCData", 2, resolve);
          });
        });
        await wait(100);
      });

      it("should log load event", async () => {
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

      it("should log activity for getTCData", async () => {
        const queue = await page.evaluate(() => {
          return window.callbackQueue;
        });
        expect(queue).toHaveLength(2);
        expect(queue[1]).toEqual({
          event: "getTCData",
          parameters: { status: "disabled" },
          success: true,
          ts: expect.any(Number),
        });
      });

      describe("and setConsent API method is called again", () => {
        let consentCookieLoaded;

        beforeAll(async () => {
          consentCookieLoaded = page.waitForResponse((response) => response.url().includes("set-consent"));
          await page.evaluate(() => {
            return new Promise((resolve) => {
              window.__tcfapi("setConsent", 2, resolve, false);
            });
          });
          await consentCookieLoaded;
          await wait(100);
        });

        it("should log activity for setConsent", async () => {
          const queue = await page.evaluate(() => {
            return window.callbackQueue;
          });
          expect(queue).toHaveLength(3);
          expect(queue[2]).toEqual({
            event: "setConsent",
            parameters: {
              consent: false,
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
