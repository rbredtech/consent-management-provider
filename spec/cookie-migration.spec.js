const { describe, test, expect } = require("@jest/globals");
const pageHelper = require("./helper/page");

describe("Consent cookie migration", () => {
  describe("new cookie is not yet present", () => {
    let page;

    beforeEach(async () => {
      page = await pageHelper.get();
      await page.setUserAgent("useragent Presto1.2 version"); // use no-iframe useragent to be able to read/write localStorage
      await page.goto(`${pageHelper.HTTP_PROTOCOL}://${pageHelper.HTTP_HOST}/health`);
    }, 20000);

    afterEach(async () => {
      await page.browser().close();
    }, 20000);

    test("_migrateConsent method writes existing consent to new cookie", async () => {
      await page.evaluate(function () {
        return new Promise((resolve) => {
          localStorage.setItem("xconsent", false);
          localStorage.removeItem("agttconsent");
          resolve();
        });
      });
      await pageHelper.initLoader(page, 0);

      const tcData = await page.evaluate(`(new Promise((resolve)=>{window.__cmpapi('getTCData', 2, resolve)}))`);
      const localStorage = await page.evaluate(function () {
        return Promise.resolve(localStorage.getItem("agttconsent"));
      });

      expect(tcData.vendor.consents[4040]).toBe(false);
      expect(localStorage).toBe("4040~false");
    });
  });

  describe("new cookie is already set", () => {
    let page;

    beforeEach(async () => {
      page = await pageHelper.get();
      await page.setUserAgent("useragent Presto1.2 version"); // use no-iframe useragent to be able to read/write localStorage
      await page.goto(`${pageHelper.HTTP_PROTOCOL}://${pageHelper.HTTP_HOST}/health`);
    }, 20000);

    afterEach(async () => {
      await page.browser().close();
    }, 20000);

    test("_migrateConsent method should not change an already existing consent decision", async () => {
      await page.evaluate(function () {
        return new Promise((resolve) => {
          localStorage.setItem("xconsent", false);
          localStorage.setItem("agttconsent", "4040~true");
          resolve();
        });
      });
      await pageHelper.initLoader(page, 0);

      const tcData = await page.evaluate(function () {
        return new Promise((resolve) => {
          window.__cmpapi("getTCData", 2, resolve);
        });
      });

      expect(tcData.vendor.consents[4040]).toBe(true);
    });

    test("_migrateConsent method should not remove an already existing consent decision", async () => {
      await page.evaluate(function () {
        return new Promise((resolve) => {
          localStorage.setItem("xconsent", false);
          localStorage.setItem("agttconsent", "4041~true");
          resolve();
        });
      });
      await pageHelper.initLoader(page, 0);

      const tcData = await page.evaluate(function () {
        return new Promise((resolve) => {
          window.__cmpapi("getTCData", 2, resolve);
        });
      });

      expect(tcData.vendor.consents[4040]).toBe(false);
      expect(tcData.vendor.consents[4041]).toBe(true);
    });
  });
});
