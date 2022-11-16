const {
  describe,
  beforeAll,
  test,
  expect,
  afterAll,
} = require("@jest/globals");
const puppeteer = require("puppeteer");
const HTTP_HOST = process.env.HTTP_HOST || "localhost:8080";

const consentLoader = {
  PROTOCOL: process.env.CONSENT_LOADER_PROTOCOL || "http",
  HOST: process.env.CONSENT_LOADER_HOST || "localhost",
  PORT: process.env.CONSENT_LOADER_PORT || "8080",
};
let browser, page;

beforeAll(async () => {
  browser = await puppeteer.launch({
    dumpio: true,
    args: ["--disable-gpu"],
  });
  page = await browser.newPage();
  page.on("request", (request) => console.log("request", request.url()));
  page.on("response", (response) =>
    console.log("response", response.url(), response.status())
  );
});

afterAll(async () => {
  await browser.close();
}, 20000);

describe("Consent Management with technical cookie", () => {
  beforeAll(async () => {
    await page.goto(`http://${HTTP_HOST}/health`);
    await page.setCookie({
      value: (Date.now() - 3600000 * 25).toString(),
      expires: Date.now() + 3600 * 1,
      domain: consentLoader.HOST,
      name: "xt",
    });
    await page.evaluate(
      `localStorage.setItem("xt", "${Date.now() - 3600000 * 49}");`
    );
  });

  describe("Is loaded", () => {
    beforeAll(async () => {
      const isLoaded = page.waitForResponse((response) =>
        response.url().includes("manager-iframe")
      );
      await page.setContent(
        `<script type='text/javascript' src="http://${HTTP_HOST}/loader.js"></script>`
      );
      await isLoaded;
    });

    test("Storage status is enabled", async () => {
      const result = page.evaluate(
        `(new Promise((resolve)=>{window.__tcfapi('getTCData', 1, resolve)}))`
      );
      const status = await result;

      expect(status.cmpStatus).toBe("loaded");
      expect(status.vendor["consent"]).toBeUndefined();
      expect(status.tcfPolicyVersion).toBe(2);
    });
  });
});
