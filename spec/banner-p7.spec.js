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
  beforeAll(async () => {
    await page.goto(`${pageHelper.HTTP_PROTOCOL}://${pageHelper.HTTP_HOST}/health`);
    await pageHelper.initLoader(page, 3300, true);
  });

  test("Banner pop-up is NOT displayed", async () => {
    await expect(
      page.waitForSelector("div#agttcnsntbnnr", {
        visible: true,
        timeout: 1000,
      }),
    ).rejects.toBeDefined();
  });

  describe("When showBanner API method is called", () => {
    beforeAll(async () => {
      await page.evaluate(function () {
        window.__cbapi("showBanner", 2);
      });
    });

    test("Banner pop-up is displayed", async () => {
      await expect(
        page.waitForSelector("div#agttcnsntbnnr", {
          visible: true,
          timeout: 1000,
        }),
      ).resolves.toBeDefined();
    });

    test("Channel specific information should NOT be present", async () => {
      expect(await page.$eval("div#agttcnsntbnnr", (node) => node.innerText)).not.toContain("deren Mitglied");
    });
  });
});
