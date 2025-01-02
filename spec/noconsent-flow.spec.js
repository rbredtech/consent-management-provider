const { describe, beforeAll, afterAll, test, expect } = require("@jest/globals");
const pageHelper = require("./helper/page");

const cases = [
  [true, true], // [localStorage, iFrame]
  [true, false],
  [false, true],
  [false, false],
];

describe.each(cases)(
  "Consent Management with technical cookie - localStorage: %s, iFrame: %s",
  (localStorage, iFrame) => {
    let page;

    beforeAll(async () => {
      page = await pageHelper.get(!localStorage, !iFrame);
      await page.goto(`${pageHelper.HTTP_PROTOCOL}://${pageHelper.HTTP_HOST}/health`);
    }, 5000);

    afterAll(async () => {
      await page.browser().close();
    }, 5000);

    describe("Is loaded", () => {
      beforeAll(async () => {
        await pageHelper.initLoader(page);
      });

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
          await pageHelper.initLoader(page);
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
  },
);
