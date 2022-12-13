const { describe, beforeAll, afterAll, test, expect } = require("@jest/globals");
const pageHelper = require("./helper/page");
let page;

beforeAll(async () => {
  page = await pageHelper.get();
}, 20000);

afterAll(async () => {
  await page.browser().close();
}, 20000);

describe("Consent Management with banner", () => {
  let iframe;
  beforeAll(async () => {
    await pageHelper.initLoader(page, 0, true);
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

    test("Channel specific information should be present", async () => {
      expect(await iframe.$eval("div#agttcnstbnnr", (node) => node.innerText)).toContain("deren Mitglied");
    });

    test("Channel Name is replaced in legal text", async () => {
      expect(await iframe.$eval("div#agttcnstbnnr", (node) => node.innerText)).toContain("ServusTV");
    });

    describe("When OK button is hit", () => {
      let consentSent;

      beforeAll(async () => {
        consentSent = page.waitForRequest((request) => request.url().includes("set-consent"));
        await page.evaluate(() => {
          window.__tcfapi("handleKey", 2, console.log, 13);
        });
      });

      test("Consent is sent", async () => {
        expect((await consentSent).url()).toContain("set-consent?consent=1");
      });

      describe("When banner is requested again", () => {
        beforeAll(async () => {
          await page.evaluate(`window.__tcfapi('showBanner', 2, console.log)`);
        });

        describe("And Dismiss is selected", () => {
          let consentSent;

          beforeAll(async () => {
            consentSent = page.waitForRequest((request) => request.url().includes("set-consent"));
            await page.evaluate(() => {
              window.__tcfapi("handleKey", 2, console.log, 37);
              window.__tcfapi("handleKey", 2, console.log, 13);
            });
          });

          test("Consent revoke is sent", async () => {
            expect((await consentSent).url()).toContain("set-consent?consent=0");
          });
        });
      });
    });
  });
});
