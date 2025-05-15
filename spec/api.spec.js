const { describe, beforeAll, afterAll, test, expect } = require("@jest/globals");
const pageHelper = require("./helper/page");

const cases = [
  [true, true], // [localStorage, iFrame]
  [true, false],
  [false, true],
  [false, false],
];

describe.each(cases)("API is called right after loading - localStorage: %s, iFrame: %s", (localStorage, iFrame) => {
  let apiResponse, page;

  beforeAll(async () => {
    page = await pageHelper.get(!localStorage, !iFrame);
  }, 5000);

  afterAll(async () => {
    await page.browser().close();
  }, 5000);

  beforeAll(async () => {
    await pageHelper.init(page);
    apiResponse = await page.evaluate(
      () =>
        new Promise((resolve) => {
          window.__cmpapi("getTCData", 2, resolve);
        }),
    );
  });

  test("Callback is eventually called", () => {
    expect(apiResponse).toBeDefined();
    expect(apiResponse).toHaveProperty("vendor");
    expect(apiResponse).toHaveProperty("cmpStatus");
  });
});
