const { describe, beforeAll, afterAll, test, expect } = require("@jest/globals");
const pageHelper = require("./helper/page");
let page;

beforeAll(async () => {
  page = await pageHelper.get();
}, 20000);

afterAll(async () => {
  await page.browser().close();
}, 20000);

describe.each([false, true])("Consent Management is loaded - with tracking script integration: %s", (withTracking) => {
  beforeAll(async () => {
    await page.goto(`${pageHelper.HTTP_PROTOCOL}://${pageHelper.HTTP_HOST}/health`);
    await (withTracking ? pageHelper.initLoaderWithTracking(page) : pageHelper.initLoader(page));
  });

  test("Ping API call returns basic configuration", async () => {
    const result = page.evaluate(() => {
      return new Promise((resolve) => {
        window.__cmpapi("ping", 1, resolve);
      });
    });

    return expect(result).resolves.toEqual({
      apiVersion: "2.0",
      cmpId: 4040,
      cmpLoaded: true,
      cmpStatus: "disabled",
      cmpVersion: 1,
      displayStatus: "hidden",
      gdprApplies: true,
      gvlVersion: 1,
      tcfPolicyVersion: 2,
    });
  });

  test("Storage status is disabled", async () => {
    const apiResponse = await page.evaluate(() => {
      return new Promise((resolve) => {
        window.__cmpapi("getTCData", 1, resolve);
      });
    });

    expect(apiResponse.cmpStatus).toBe("disabled");
    expect(apiResponse.vendor["consents"]).toBeDefined();
    expect(apiResponse.vendor["consents"]["4040"]).toBeUndefined();
    expect(apiResponse.vendor["consents"]["4041"]).toBeUndefined();
  });

  if (withTracking) {
    test("Tracking script api is available", async () => {
      const did = await page.evaluate(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            window.__hbb_tracking_tgt.getDID(resolve);
          }, 1000);
        });
      });
      expect(did).not.toBeUndefined();
    });
  }
});
