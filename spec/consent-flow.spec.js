const pageHelper = require("./helper/page");

const cases = [
  [true, true], // [localStorage, iFrame]
  [true, false],
  [false, true],
  [false, false],
];

describe.each(cases)("Consent flow - localStorage: %s, iFrame: %s", (localStorage, iFrame) => {
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
        const setConsentEndpointCalled = page.waitForResponse((response) => response.url().includes("/set-consent"));
        await page.evaluate(
          () =>
            new Promise((resolve) => {
              window.__cmpapi("setConsent", 2, resolve, true);
            }),
        );
        await setConsentEndpointCalled;
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
        const removeConsentEndpointCalled = page.waitForResponse((response) => response.url().includes("/remove-consent"));
        await page.evaluate(
          () =>
            new Promise((resolve) => {
              window.__cmpapi("removeConsentDecision", 2, resolve, true);
            }),
        );
        await removeConsentEndpointCalled;
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
        const removeConsentEndpointCalled = page.waitForResponse((response) => response.url().includes("/remove-consent"));
        await page.evaluate(
          () =>
            new Promise((resolve) => {
              window.__cmpapi("removeConsentDecision", 2, resolve, true);
            }),
        );
        await removeConsentEndpointCalled;
      });

      test("Storage status is enabled and vendor specific consents are set", async () => {
        const setConsentEndpointCalled = page.waitForResponse((response) => response.url().includes("/set-consent"));
        await page.evaluate(
          () =>
            new Promise((resolve) => {
              window.__cmpapi("setConsentByVendorId", 2, resolve, { 4041: true, 1234: false });
            }),
        );
        await setConsentEndpointCalled;

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
        const setConsentEndpointCalled = page.waitForResponse((response) => response.url().includes("/set-consent"));
        await page.evaluate(
          () =>
            new Promise((resolve) => {
              window.__cmpapi("setConsentByVendorId", 2, resolve, { 4041: false });
            }),
        );
        await setConsentEndpointCalled;

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
