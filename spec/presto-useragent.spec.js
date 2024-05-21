const { describe, beforeAll, afterAll, test, expect } = require("@jest/globals");
const pageHelper = require("./helper/page");
let page;

beforeAll(async () => {
  page = await pageHelper.get();
}, 20000);

afterAll(async () => {
  await page.browser().close();
}, 20000);

describe("Consent Management with Presto user agent", () => {
  beforeAll(async () => {
    await page.setUserAgent("useragent Presto1.2 version");
    await page.goto(`http://${pageHelper.HTTP_HOST}/health`);
    await page.evaluate(`localStorage.setItem("xt", "${Date.now() - 3600000 * 49}");`);
  });

  describe("Is loaded", () => {
    let cmpapiJsLoaded;

    beforeAll(async () => {
      cmpapiJsLoaded = page.waitForResponse((response) => response.url().includes("cmpapi.js"));
      await pageHelper.initLoader(page);
    });

    test("Loads 3rd party version of API", async () => {
      expect(await cmpapiJsLoaded).toBeDefined();
    });

    test("Storage status is enabled and consent is false", async () => {
      const apiResponse = await page.evaluate(`(new Promise((resolve)=>{window.__cmpapi('getTCData', 2, resolve)}))`);

      expect(apiResponse.cmpStatus).toBe("loaded");
      expect(apiResponse.vendor["consents"]).toBeDefined();
      expect(apiResponse.vendor["consents"]["4040"]).toBeUndefined();
      expect(apiResponse.vendor["consents"]["4041"]).toBeUndefined();
    });
  });
});
