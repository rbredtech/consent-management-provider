const { describe, beforeAll, afterAll, test, expect } = require("@jest/globals");
const pageHelper = require("./helper/page");
let page;

beforeAll(async () => {
  page = await pageHelper.get();
}, 20000);

afterAll(async () => {
  await page.browser().close();
}, 20000);

describe("Consent Management with ServusTv channelId", () => {
  let iframeResponse, tcfapiResponse;

  beforeAll(async () => {
    await page.goto(`${pageHelper.HTTP_PROTOCOL}://${pageHelper.HTTP_HOST}/health`);
    iframeResponse = page.waitForResponse((response) => response.url().includes("iframe.html"));
    tcfapiResponse = page.waitForResponse((response) => response.url().includes("tcfapi.js"));
    await pageHelper.initLoader(page, 0);
  });

  test("Passing through channelId for iframe request", async () => {
    expect((await iframeResponse).url()).toContain("channelId=0");
  });

  test("Passing through channelId for tcfapi request", async () => {
    expect((await tcfapiResponse).url()).toContain("channelId=0");
  });

  describe("When consent is set", () => {
    let setConsentResponse = beforeAll(async () => {
      setConsentResponse = page.waitForResponse((response) => response.url().includes("set-consent"));
      await page.evaluate(`(new Promise((resolve)=>{window.__tcfapi('setConsent', 2, resolve, true);}))`);
    });

    test("Passing through channelId for setConsent request", async () => {
      expect((await setConsentResponse).url()).toContain("channelId=0");
    });
  });
});
