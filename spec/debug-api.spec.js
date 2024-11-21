const { describe, beforeAll, expect, afterAll, it } = require("@jest/globals");
const pageHelper = require("./helper/page");
const { HTTP_PROTOCOL } = require("./helper/page");

let page;

describe.each([true, false])("Debug API - localStorage: %s", (localStorageEnabled) => {
  beforeAll(async () => {
    page = await pageHelper.get(!localStorageEnabled);
    await page.goto(`${HTTP_PROTOCOL}://${pageHelper.HTTP_HOST}/health`);
    await pageHelper.initLoader(page);
    await page.evaluate(() => {
      return new Promise((resolve) => {
        window.callbackQueue = [];
        window.__cmpapi("onLogEvent", 2, function (params) {
          window.callbackQueue.push(params);
        });
        resolve();
      });
    });
  }, 20000);

  afterAll(async () => {
    await page.browser().close();
  }, 20000);

  describe("when debug listener is subscribed", () => {
    describe("and getTCData API method is called", () => {
      beforeAll(async () => {
        await page.evaluate(() => {
          return new Promise((resolve) => {
            window.__cmpapi("getTCData", 2, resolve);
          });
        });
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
          parameters: { consentByVendorId: {}, status: "loaded" },
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
              window.__cmpapi("setConsent", 2, resolve, false);
            });
          });
          await consentCookieLoaded;
        });

        it("should log activity for setConsent", async () => {
          const queue = await page.evaluate(() => {
            return window.callbackQueue;
          });
          expect(queue).toHaveLength(3);
          expect(queue[2]).toEqual({
            event: "setConsent",
            parameters: {
              consentByVendorId: { 4040: false, 4041: false },
              localStorageAvailable: localStorageEnabled,
            },
            success: true,
            ts: expect.any(Number),
          });
        });
      });

      describe("and a second debug listener is added", () => {
        beforeAll(async () => {
          await page.evaluate(() => {
            return new Promise((resolve) => {
              window.__cmpapi("onLogEvent", 2, function (params) {
                window.callbackQueue.push(params);
              });
              resolve();
            });
          });

          await page.evaluate(() => {
            return new Promise((resolve) => {
              window.__cmpapi("getTCData", 2, resolve);
            });
          });
        });

        it("should log activity for getTCData twice", async () => {
          const queue = await page.evaluate(() => {
            return window.callbackQueue;
          });
          expect(queue).toHaveLength(5);
          expect(queue[3]).toEqual({
            event: "getTCData",
            parameters: { status: "loaded", consentByVendorId: { 4040: false, 4041: false } },
            success: true,
            ts: expect.any(Number),
          });
          expect(queue[4]).toEqual({
            event: "getTCData",
            parameters: { status: "loaded", consentByVendorId: { 4040: false, 4041: false } },
            success: true,
            ts: expect.any(Number),
          });
        });
      });
    });
  });
});
