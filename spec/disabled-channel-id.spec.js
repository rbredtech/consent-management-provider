const { describe, beforeAll, afterAll, test, expect } = require("@jest/globals");
const pageHelper = require("./helper/page");

const cases = [
  [true, true], // [localStorage, iFrame]
  [true, false],
  [false, true],
  [false, false],
];

describe.each(cases)("Consent Management disabled by channel ID - localStorage: %s, iFrame: %s", (localStorage, iFrame) => {
  describe("loading with disabled channel ID", () => {
    let page;

    beforeAll(async () => {
      page = await pageHelper.get(!localStorage, !iFrame);
      await pageHelper.init(page, 1234);
    }, 20000);

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
      page = await pageHelper.get(!localStorage, !iFrame);
      await pageHelper.init(page, 9999);
    }, 20000);

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
