const pageHelper = require("./helper/page");

const cases = [
  [true, true], // [localStorage, iFrame]
  [true, false],
  [false, true],
  [false, false],
];

describe.each(cases)("Consent banner - localStorage: %s, iFrame: %s", (localStorage, iFrame) => {
  let page;

  beforeAll(async () => {
    page = await pageHelper.get(!localStorage, !iFrame);
    await pageHelper.init(page);
  }, 5000);

  afterAll(async () => {
    await page.browser().close();
  }, 5000);

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
        window.__cbapi("showBanner", 2, function (consentDecision) {
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

    describe("When OK button is hit", () => {
      beforeAll(async () => {
        await page.evaluate(() => {
          window.__cbapi("handleKey", 2, undefined, 13);
        });
      });

      test("Consent is saved (true)", async () => {
        const tcData = await page.evaluate(
          () =>
            new Promise((resolve) => {
              window.__cmpapi("getTCData", 2, resolve);
            }),
        );
        expect(tcData.vendor.consents).toEqual({ 4040: true, 4041: true });
      });

      describe("When banner is requested again", () => {
        beforeAll(async () => {
          await page.evaluate(() => {
            window.__cbapi("showBanner", 2, function (consentDecision) {
              if (typeof consentDecision === "boolean") {
                window.__cmpapi("setConsent", 2, undefined, consentDecision);
              }
            });
          });
        });

        describe("And Dismiss is selected", () => {
          beforeAll(async () => {
            await page.evaluate(() => {
              window.__cbapi("handleKey", 2, undefined, 37);
              window.__cbapi("handleKey", 2, undefined, 13);
            });
          });

          test("Consent revoke is saved (false)", async () => {
            const tcData = await page.evaluate(
              () =>
                new Promise((resolve) => {
                  window.__cmpapi("getTCData", 2, resolve);
                }),
            );
            expect(tcData.vendor.consents).toEqual({ 4040: false, 4041: false });
          });
        });
      });
    });
  });
});
