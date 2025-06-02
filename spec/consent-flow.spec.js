const { describe, beforeAll, afterAll, test, expect } = require("@jest/globals");
const pageHelper = require("./helper/page");

const cases = [
  [true, true], // [localStorage, iFrame]
  [true, false],
  [false, true],
  [false, false],
];

describe.each(cases)("Consent Management with technical cookie - localStorage: %s, iFrame: %s", (localStorage, iFrame) => {
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

    test("Storage status is enabled and consent is not defined", async () => {
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

    describe("When consent is given", () => {
      beforeAll(async () => {
        await page.evaluate(
          () =>
            new Promise((resolve) => {
              window.__cmpapi("setConsent", 2, resolve, true);
            }),
        );
      });

      test("Storage status is enabled and consent is true", async () => {
        const apiResponse = await page.evaluate(
          () =>
            new Promise((resolve) => {
              window.__cmpapi("getTCData", 2, resolve);
            }),
        );

        expect(apiResponse.cmpStatus).toBe("loaded");
        expect(apiResponse.vendor["consents"]).toBeDefined();
        expect(apiResponse.vendor["consents"]["4040"]).toBe(true);
        expect(apiResponse.vendor["consents"]["4041"]).toBe(true);
      });
    });

    describe("When consent is deleted", () => {
      beforeAll(async () => {
        await page.evaluate(
          () =>
            new Promise((resolve) => {
              window.__cmpapi("removeConsentDecision", 2, resolve, true);
            }),
        );
      });

      test("Storage status is enabled and consent is not defined", async () => {
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

    describe("When consent is given for specific vendorId", () => {
      beforeAll(async () => {
        await page.evaluate(
          () =>
            new Promise((resolve) => {
              window.__cmpapi("removeConsentDecision", 2, resolve, true);
            }),
        );
      });

      test("Storage status is enabled and vendor specific consents are set", async () => {
        await page.evaluate(
          () =>
            new Promise((resolve) => {
              window.__cmpapi("setConsentByVendorId", 2, resolve, { 4041: true, 1234: false });
            }),
        );
        const apiResponse = await page.evaluate(
          () =>
            new Promise((resolve) => {
              window.__cmpapi("getTCData", 2, resolve);
            }),
        );

        expect(apiResponse.cmpStatus).toBe("loaded");
        expect(apiResponse.vendor["consents"]).toBeDefined();
        expect(apiResponse.vendor["consents"]["4040"]).toBeUndefined();
        expect(apiResponse.vendor["consents"]["4041"]).toBe(true);
        expect(apiResponse.vendor["consents"]["1234"]).toBe(false);
      });

      test("Storage status is enabled and vendor specific consents are updated", async () => {
        await page.evaluate(
          () =>
            new Promise((resolve) => {
              window.__cmpapi("setConsentByVendorId", 2, resolve, { 4041: false });
            }),
        );
        const apiResponse = await page.evaluate(
          () =>
            new Promise((resolve) => {
              window.__cmpapi("getTCData", 2, resolve);
            }),
        );

        expect(apiResponse.cmpStatus).toBe("loaded");
        expect(apiResponse.vendor["consents"]).toBeDefined();
        expect(apiResponse.vendor["consents"]["4040"]).toBeUndefined();
        expect(apiResponse.vendor["consents"]["4041"]).toBe(false);
        expect(apiResponse.vendor["consents"]["1234"]).toBe(false);
      });
    });
  });
});
