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
  let iframeResponse, cmpapiResponse;

  beforeAll(async () => {
    await page.goto(`${pageHelper.HTTP_PROTOCOL}://${pageHelper.HTTP_HOST}/health`);
    iframeResponse = page.waitForResponse((response) => response.url().includes("iframe.html"));
    cmpapiResponse = page.waitForResponse((response) => response.url().includes("cmpapi"));
    await pageHelper.initLoader(page, 0);
  });

  test("Passing through channelId for iframe request", async () => {
    expect((await iframeResponse).url()).toContain("channelId=0");
  });

  test("Passing through channelId for cmpapi request", async () => {
    expect((await cmpapiResponse).url()).toContain("channelId=0");
  });

  describe("When consent is set", () => {
    let setConsentResponse = beforeAll(async () => {
      setConsentResponse = page.waitForResponse((response) => response.url().includes("set-consent"));
      await page.evaluate(`(new Promise((resolve)=>{window.__cmpapi('setConsent', 2, resolve, true);}))`);
    });

    test("Passing through channelId for setConsent request", async () => {
      expect((await setConsentResponse).url()).toContain("channelId=0");
    });
  });
});
