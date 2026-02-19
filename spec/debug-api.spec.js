const pageHelper = require("./helper/page");

async function waitForQueueLength(page, length, timeout = 5000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const len = await page.evaluate(() => window.callbackQueue.length);
    if (len >= length) return;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error(`Timed out waiting for callbackQueue.length >= ${length}`);
}

const cases = [
  [true, true], // [localStorage, iFrame]
  [true, false],
  [false, true],
  [false, false],
];

describe.each(cases)("Debug API - localStorage: %s, iFrame: %s", (localStorage, iFrame) => {
  let page;

  beforeAll(async () => {
    page = await pageHelper.get(!localStorage, !iFrame);
    await pageHelper.init(page);
  }, 20000);

  afterAll(async () => {
    await page.browser().close();
  }, 20000);

  describe("when debug listener is subscribed", () => {
    beforeAll(async () => {
      await page.evaluate(
        () =>
          new Promise((resolve) => {
            window.callbackQueue = [];
            window.__cmpapi("onLogEvent", 2, function (params) {
              window.callbackQueue.push(params);
            });
            resolve();
          }),
      );
    });

    describe("and getTCData API method is called", () => {
      beforeAll(async () => {
        await page.evaluate(
          () =>
            new Promise((resolve) => {
              window.__cmpapi("getTCData", 2, resolve);
            }),
        );
      });

      it("should log load event", async () => {
        await waitForQueueLength(page, 2);
        const queue = await page.evaluate(() => {
          return window.callbackQueue;
        });
        expect(queue).toHaveLength(2);
        expect(queue[0]).toEqual({
          event: "loaded",
          parameters: { type: iFrame ? "iframe" : "3rdparty" },
          success: true,
          ts: expect.any(Number),
        });
      });

      it("should log activity for getTCData", async () => {
        await waitForQueueLength(page, 2);
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
        beforeAll(async () => {
          const setConsentEndpointCalled = page.waitForResponse((response) => response.url().includes("/set-consent"));
          await page.evaluate(() => {
            return new Promise((resolve) => {
              window.__cmpapi("setConsent", 2, resolve, false);
            });
          });
          await setConsentEndpointCalled;
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
              localStorageAvailable: localStorage,
            },
            success: true,
            ts: expect.any(Number),
          });
        });
      });

      describe("and a second debug listener is added", () => {
        beforeAll(async () => {
          await page.evaluate(() => {
            window.__cmpapi("onLogEvent", 2, function (params) {
              window.callbackQueue.push(params);
            });
          });

          await page.evaluate(
            () =>
              new Promise((resolve) => {
                window.__cmpapi("getTCData", 2, resolve);
              }),
          );
        });

        it("should log activity for getTCData twice", async () => {
          await waitForQueueLength(page, 5);
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
