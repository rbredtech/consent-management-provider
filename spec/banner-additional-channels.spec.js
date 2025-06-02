const { describe, beforeAll, afterAll, test, expect } = require("@jest/globals");
const pageHelper = require("./helper/page");

const cases = [
  [true, true], // [localStorage, iFrame]
  [true, false],
  [false, true],
  [false, false],
];

describe.each(cases)("Consent banner (additional channels) - localStorage: %s, iFrame: %s", (localStorage, iFrame) => {
  let page;

  beforeAll(async () => {
    page = await pageHelper.get(!localStorage, !iFrame);
    await pageHelper.init(page, 0, true);
  }, 20000);

  afterAll(async () => {
    await page.browser().close();
  }, 20000);

  test("Banner pop-up is NOT displayed", async () => {
    await expect(
      page.waitForSelector("div#agttcnstbnnr", {
        visible: true,
        timeout: 1000,
      }),
    ).rejects.toBeDefined();
  });

  describe("When showBanner API method is called", () => {
    beforeAll(async () => {
      await page.evaluate(() => {
        window.__cbapi("showAdditionalChannelsBanner", 2, function (consentDecision) {
          if (typeof consentDecision === "boolean") {
            window.__cmpapi("setConsent", 2, undefined, consentDecision);
          }
        });
      });
    });

    test("Banner pop-up is displayed", async () => {
      await expect(
        page.waitForSelector("div#agttcnstbnnr", {
          visible: true,
          timeout: 1000,
        }),
      ).resolves.toBeDefined();
    });

    test("Previously given consent should be mentioned", async () => {
      const bannerText = await page.$eval("div#agttcnstbnnr", (node) => node.innerText);
      expect(bannerText).toContain("Sie bereits Ihre Einwilligung");
    });

    describe("When OK button is hit", () => {
      let consentSent;

      beforeAll(async () => {
        consentSent = page.waitForRequest((request) => request.url().includes("set-consent"));
        await page.evaluate(() => {
          window.__cbapi("handleKey", 2, undefined, 13);
        });
      });

      test("Consent is sent", async () => {
        expect((await consentSent).url()).toContain("set-consent?consentByVendorId=4040~true,4041~true");
      });

      describe("When banner is requested again", () => {
        beforeAll(async () => {
          await page.evaluate(() => {
            window.bannerCloseReason = "no-reason";
            window.__cbapi("showAdditionalChannelsBanner", 2, function (consentDecision, reason) {
              window.bannerCloseReason = reason;
              if (typeof consentDecision === "boolean") {
                window.__cmpapi("setConsent", 2, undefined, consentDecision);
              }
            });
          });
        });

        describe("And 'go to settings' is selected", () => {
          beforeAll(async () => {
            await page.evaluate(() => {
              window.__cbapi("handleKey", 2, console.log, 39);
              window.__cbapi("handleKey", 2, console.log, 13);
            });
          });

          test("banner close reason should be 'go-to-settings'", async () => {
            const reason = await page.evaluate(() => {
              return Promise.resolve(window.bannerCloseReason);
            });
            expect(reason).toBe("go-to-settings");
          });
        });
      });
    });
  });
});
