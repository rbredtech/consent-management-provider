const { describe, beforeAll, afterAll, test, expect } = require("@jest/globals");
const pageHelper = require("./helper/page");
let page;

beforeAll(async () => {
  page = await pageHelper.get();
}, 20000);

afterAll(async () => {
  await page.browser().close();
}, 20000);

describe("Consent Management with banner on a P7 channel", () => {
  let iframe;
  beforeAll(async () => {
    await pageHelper.initLoader(page, 3300, true);
    iframe = (await page.frames()).find((frame) => frame.url().indexOf("iframe") > -1);
  });

  test("Banner pop-up is NOT displayed", () => {
    expect(
      iframe.waitForSelector("div#agttcnstbnnr", {
        visible: true,
        timeout: 10,
      }),
    ).rejects.toBeDefined();
  });

  describe("When showBanner API method is called", () => {
    beforeAll(async () => {
      await page.evaluate(`window.__tcfapi('showBanner', 2, console.log)`);
    });

    test("Banner pop-up is displayed", async () => {
      expect(
        await iframe.waitForSelector("div#agttcnstbnnr", {
          visible: true,
          timeout: 1000,
        }),
      ).toBeDefined();
    });

    test("Channel specific information should NOT be present", async () => {
      expect(await iframe.$eval("div#agttcnstbnnr", (node) => node.innerText)).not.toContain("deren Mitglied");
    });
  });
});
