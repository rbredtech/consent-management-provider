const { describe, beforeAll, beforeEach, afterAll, test, expect } = require("@jest/globals");
const pageHelper = require("./helper/page");
const { wait } = require("./helper/wait");
let page;

beforeAll(async () => {
  page = await pageHelper.get();
}, 20000);

afterAll(async () => {
  await page.browser().close();
}, 20000);

describe("Consent cookie migration", () => {
  beforeAll(async () => {
    await page.goto(`${pageHelper.HTTP_PROTOCOL}://${pageHelper.HTTP_HOST}/health`);
    await pageHelper.initLoader(page, 0);
    await page.evaluate(function () {
      localStorage.setItem("xconsent", true);
    });
  });

  afterEach(async () => {
    await page.evaluate(function () {
      localStorage.removeItem("agttconsent");
    });
  });

  describe("_migrateCookie api method", () => {
    describe("new cookie is not yet present", () => {
      test("_migrateCookie method writes existing consent to new cookie", async () => {
        await page.evaluate(function () {
          window.__cmpapi("_migrateCookie");
        });
        await wait(1000);
        const tcData = await page.evaluate(`(new Promise((resolve)=>{window.__cmpapi('getTCData', 2, resolve)}))`);
        expect(tcData.vendor.consents[4040]).toBe(true);
      });
    });

    describe("new cookie is already set", () => {
      test("_migrateCookie method should not change an already existing consent decision", async () => {
        await page.evaluate(function () {
          localStorage.setItem("agttconsent", "4040+false");
        });
        await page.evaluate(function () {
          window.__cmpapi("_migrateCookie");
        });
        await wait(1000);
        const tcData = await page.evaluate(`(new Promise((resolve)=>{window.__cmpapi('getTCData', 2, resolve)}))`);
        expect(tcData.vendor.consents[4040]).toBe(false);
      });

      test("_migrateCookie method should not remove an already existing consent decision", async () => {
        await page.evaluate(function () {
          localStorage.setItem("agttconsent", "4041+true");
        });
        await page.evaluate(function () {
          window.__cmpapi("_migrateCookie");
        });
        await wait(1000);
        const tcData = await page.evaluate(`(new Promise((resolve)=>{window.__cmpapi('getTCData', 2, resolve)}))`);
        expect(tcData.vendor.consents[4040]).toBe(true);
        expect(tcData.vendor.consents[4041]).toBe(true);
      });
    });
  });

  describe("getTCDate api method", () => {
    describe("with only old cookie present", () => {
      test("consent value is correctly evaluated", async () => {
        var apiResponse = await page.evaluate(`(new Promise((resolve)=>{window.__cmpapi('getTCData', 2, resolve)}))`);
        expect(apiResponse.vendor.consents[4040]).toBe(true);
      });
    });

    describe("with both cookies present", () => {
      beforeEach(async () => {
        await page.evaluate(function () {
          localStorage.setItem("agttconsent", "4040+false");
        });
      });

      test("new cookie overrules old cookie", async () => {
        var apiResponse = await page.evaluate(`(new Promise((resolve)=>{window.__cmpapi('getTCData', 2, resolve)}))`);
        expect(apiResponse.vendor.consents[4040]).toBe(false);
      });
    });
  });
});
