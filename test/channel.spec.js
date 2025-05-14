const { describe, beforeAll, afterAll, test, expect } = require("@jest/globals");
const pageHelper = require("./helper/page");

const cases = [
  [true, true], // [localStorage, iFrame]
  [true, false],
  [false, true],
  [false, false],
];

describe.each(cases)("Consent Management with ServusTv channel ID - localStorage: %s, iFrame: %s", (localStorage, iFrame) => {
  let page, iframeResponse, cmpapiResponse;

  beforeAll(async () => {
    page = await pageHelper.get(!localStorage, !iFrame);
    await page.goto(`${pageHelper.HTTP_PROTOCOL}://${pageHelper.HTTP_HOST}/health`);
    if (iFrame) {
      iframeResponse = page.waitForResponse((response) => response.url().includes("iframe.html"));
    }
    cmpapiResponse = page.waitForResponse((response) => response.url().includes("cmpapi"));
    await pageHelper.initLoader(page, 0);
  }, 5000);

  afterAll(async () => {
    await page.browser().close();
  }, 5000);

  if (iFrame) {
    test("Passing through channelId for iframe request", async () => {
      expect((await iframeResponse).url()).toContain("channelId=0");
    });
  }

  test("Passing through channelId for cmpapi request", async () => {
    expect((await cmpapiResponse).url()).toContain("channelId=0");
  });

  describe("When consent is set", () => {
    let setConsentResponse = beforeAll(async () => {
      setConsentResponse = page.waitForResponse((response) => response.url().includes("set-consent"));
      await page.evaluate(
        () =>
          new Promise((resolve) => {
            window.__cmpapi("setConsent", 2, resolve, true);
          }),
      );
    });

    test("Passing through channelId for setConsent request", async () => {
      expect((await setConsentResponse).url()).toContain("channelId=0");
    });
  });
});
