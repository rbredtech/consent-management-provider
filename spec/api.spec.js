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
    await pageHelper.init(page);
  }, 20000);

  afterAll(async () => {
    await page.browser().close();
  }, 20000);

  beforeAll(async () => {
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
