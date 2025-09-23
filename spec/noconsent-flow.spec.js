const pageHelper = require("./helper/page");

const cases = [
  [true, true], // [localStorage, iFrame]
  [true, false],
  [false, true],
  [false, false],
];

describe.each(cases)("No-consent flow - localStorage: %s, iFrame: %s", (localStorage, iFrame) => {
  let page;

  beforeAll(async () => {
    page = await pageHelper.get(!localStorage, !iFrame);
    await pageHelper.init(page);
  }, 20000);

  afterAll(async () => {
    await page.browser().close();
  }, 20000);

  describe("Is loaded", () => {
    test(`localStorage is ${localStorage ? "enabled" : "disabled"}`, async () => {
      const ls = await page.evaluate(
        () =>
          new Promise((resolve) => {
            resolve(window.localStorage);
          }),
      );
      expect(!!ls).toBe(localStorage);
    });

    test("Storage status is enabled and consent is false", async () => {
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

    describe("When consent is declined", () => {
      beforeAll(async () => {
        await page.evaluate(
          () =>
            new Promise((resolve) => {
              window.__cmpapi("setConsent", 1, resolve, false);
            }),
        );
      });

      test("Storage status is enabled and consent is false", async () => {
        const apiResponse = await page.evaluate(
          () =>
            new Promise((resolve) => {
              window.__cmpapi("getTCData", 2, resolve);
            }),
        );

        expect(apiResponse.cmpStatus).toBe("loaded");
        expect(apiResponse.vendor["consents"]).toBeDefined();
        expect(apiResponse.vendor["consents"]["4040"]).toBe(false);
        expect(apiResponse.vendor["consents"]["4041"]).toBe(false);
      });
    });
  });
});
