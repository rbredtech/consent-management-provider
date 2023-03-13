const { describe, beforeAll, afterAll, test, expect } = require("@jest/globals");
const pageHelper = require("./helper/page");
let page;

beforeAll(async () => {
  page = await pageHelper.get();
}, 20000);

afterAll(async () => {
  await page.browser().close();
}, 20000);

describe("Backward compatibility", () => {
  beforeAll(async () => {
    await page.goto(`${pageHelper.HTTP_PROTOCOL}://${pageHelper.HTTP_HOST}/health`);
    await pageHelper.initLoader(page);
  });

  test("Ping API call returns basic configuration", async () => {
    const result = page.evaluate(`(new Promise((resolve)=>{window.__tcfapi('ping', 1, resolve)}))`);

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
    const apiResponse = await page.evaluate(`(new Promise((resolve)=>{window.__tcfapi('getTCData', 1, resolve)}))`);

    expect(apiResponse.cmpStatus).toBe("disabled");
    expect(apiResponse.vendor["consents"]).toBeDefined();
    expect(apiResponse.vendor["consents"]["4040"]).toBeUndefined();
  });
});
