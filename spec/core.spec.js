const pageHelper = require("./helper/page");

const cases = [
  [true, true], // [localStorage, iFrame]
  [true, false],
  [false, true],
  [false, false],
];

describe.each(cases)("CMP core - localStorage: %s, iFrame: %s", (localStorage, iFrame) => {
  let page;

  beforeAll(async () => {
    page = await pageHelper.get(!localStorage, !iFrame);
    await pageHelper.init(page);
  }, 20000);

  afterAll(async () => {
    await page.browser().close();
  }, 20000);

  test("Ping API call returns basic configuration", async () => {
    const result = page.evaluate(() => {
      return new Promise((resolve) => {
        window.__cmpapi("ping", 2, resolve);
      });
    });

    return expect(result).resolves.toEqual({
      apiVersion: "2.0",
      cmpId: 4040,
      cmpLoaded: true,
      cmpStatus: "loaded",
      cmpVersion: 1,
      displayStatus: "hidden",
      gdprApplies: true,
      gvlVersion: 1,
      tcfPolicyVersion: 2,
    });
  });

  test("Storage status is enabled", async () => {
    const apiResponse = await page.evaluate(
      () =>
        new Promise((resolve) => {
          window.__cmpapi("getTCData", 2, resolve);
        }),
    );

    expect(apiResponse.cmpStatus).toBe("loaded");
    expect(apiResponse.vendor["consents"]).toBeDefined();
    expect(apiResponse.vendor["consents"]["4040"]).toBeUndefined();
    expect(apiResponse.vendor["consents"]["4041"]).toBeUndefined();
  });
});
