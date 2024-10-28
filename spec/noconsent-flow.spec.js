const { describe, beforeAll, afterAll, test, expect } = require("@jest/globals");
const pageHelper = require("./helper/page");
const { HTTP_PROTOCOL } = require("./helper/page");
let page;

beforeAll(async () => {
  page = await pageHelper.get();
}, 20000);

afterAll(async () => {
  await page.browser().close();
}, 20000);

describe("Consent Management with technical cookie", () => {
  beforeAll(async () => {
    await page.goto(`${HTTP_PROTOCOL}://${pageHelper.HTTP_HOST}/health`);
    await page.evaluate(`localStorage.setItem("xt", "${Date.now() - 3600000 * 49}");`);
  });

  describe("Is loaded", () => {
    beforeAll(async () => {
      await pageHelper.initLoader(page);
    });

    test("Storage status is enabled and consent is false", async () => {
      const apiResponse = await page.evaluate(`(new Promise((resolve)=>{window.__cmpapi('getTCData', 2, resolve)}))`);

      expect(apiResponse.cmpStatus).toBe("loaded");
      expect(apiResponse.vendor["consents"]).toBeDefined();
      expect(apiResponse.vendor["consents"]["4040"]).toBeUndefined();
      expect(apiResponse.vendor["consents"]["4041"]).toBeUndefined();
    });

    describe("When consent is declined", () => {
      beforeAll(async () => {
        await page.evaluate(`(new Promise((resolve)=>{window.__cmpapi('setConsent', 1, resolve, false);}))`);
        await pageHelper.initLoader(page);
      });

      test("Storage status is enabled and consent is false", async () => {
        const apiResponse = await page.evaluate(`(new Promise((resolve)=>{window.__cmpapi('getTCData', 2, resolve)}))`);

        expect(apiResponse.cmpStatus).toBe("loaded");
        expect(apiResponse.vendor["consents"]).toBeDefined();
        expect(apiResponse.vendor["consents"]["4040"]).toBe(false);
        expect(apiResponse.vendor["consents"]["4041"]).toBe(false);
      });
    });
  });
});
