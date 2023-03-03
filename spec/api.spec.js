const { describe, beforeAll, afterAll, test, expect } = require("@jest/globals");
const pageHelper = require("./helper/page");

let page;

beforeAll(async () => {
  page = await pageHelper.get();
}, 20000);

afterAll(async () => {
  await page.browser().close();
}, 20000);

describe("API is called right after loading", () => {
  let apiResponse;

  beforeAll(async () => {
    await page.goto(`${pageHelper.HTTP_PROTOCOL}://${pageHelper.HTTP_HOST}/health`);
    await pageHelper.initLoader(page);
    apiResponse = await page.evaluate(`(new Promise((resolve)=>{window.__cmpapi('getTCData', 1, resolve)}))`);
  });

  test("Callback is eventually called", () => {
    expect(apiResponse).toBeDefined();
    expect(apiResponse).toHaveProperty("vendor");
    expect(apiResponse).toHaveProperty("cmpStatus");
  });
});
