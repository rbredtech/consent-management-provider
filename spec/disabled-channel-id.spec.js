const { describe, beforeAll, afterAll, test, expect } = require("@jest/globals");
const pageHelper = require("./helper/page");
const { HTTP_PROTOCOL } = require("./helper/page");

describe("Consent Management disabled by channel ID", () => {
  describe("loading with disabled channel ID", () => {
    let page;

    beforeAll(async () => {
      page = await pageHelper.get();
      await page.goto(`${HTTP_PROTOCOL}://${pageHelper.HTTP_HOST}/health`);
      await pageHelper.initLoader(page, 1234);
    });

    afterAll(async () => {
      await page.browser().close();
    }, 20000);

    test("Storage status is disabled", async () => {
      const apiResponse = await page.evaluate(() => {
        return new Promise((resolve) => {
          window.__cmpapi("getTCData", 2, resolve);
        });
      });
      expect(apiResponse.cmpStatus).toBe("disabled");
    });
  });

  describe("loading with not disabled channel ID", () => {
    let page;

    beforeAll(async () => {
      page = await pageHelper.get();
      await page.goto(`${HTTP_PROTOCOL}://${pageHelper.HTTP_HOST}/health`);
      await pageHelper.initLoader(page, 9999);
    });

    afterAll(async () => {
      await page.browser().close();
    }, 20000);

    test("Storage status is loaded", async () => {
      const apiResponse = await page.evaluate(() => {
        return new Promise((resolve) => {
          window.__cmpapi("getTCData", 2, resolve);
        });
      });
      expect(apiResponse.cmpStatus).toBe("loaded");
    });
  });
});
