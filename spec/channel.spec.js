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
  let iframeResponse, managerResponse;

  beforeAll(async () => {
    iframeResponse = page.waitForResponse((response) => response.url().includes("iframe"));
    managerResponse = page.waitForResponse((response) => response.url().includes("manager"));
    await pageHelper.initLoader(page, 0);
  });

  test("Passing through channelId for iframe request", async () => {
    expect((await iframeResponse).url()).toContain("channelId=0");
  });

  test("Passing through channelId for manager request", async () => {
    expect((await managerResponse).url()).toContain("channelId=0");
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
