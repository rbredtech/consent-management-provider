const pageHelper = require("./helper/page");

const cases = [
  [true, true], // [localStorage, iFrame]
  [true, false],
  [false, true],
  [false, false],
];

describe.each(cases)("Additional channels banner (AGF) - localStorage: %s, iFrame: %s", (localStorage, iFrame) => {
  let page;

  beforeAll(async () => {
    page = await pageHelper.get(!localStorage, !iFrame);
    await pageHelper.init(page, true);
  }, 20000);

  afterAll(async () => {
    await page.browser().close();
  }, 20000);

  test("Banner pop-up is NOT displayed", async () => {
    await expect(
      page.waitForSelector("div#agfcnsntbnnr", {
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
            window.__cmpapi("setConsentByVendorId", 2, undefined, { 5050: consentDecision, 5051: consentDecision });
          }
        });
      });
    });

    test("Banner pop-up is displayed", async () => {
      await expect(
        page.waitForSelector("div#agfcnsntbnnr", {
          visible: true,
          timeout: 1000,
        }),
      ).resolves.toBeDefined();
    });

    test("Previously given consent should be mentioned", async () => {
      const bannerText = await page.$eval("div#agfcnsntbnnr", (node) => node.innerText);
      expect(bannerText).toContain("zu einem früheren Zeitpunkt zugestimmt");
    });

    describe("When Zustimmen button is hit", () => {
      beforeAll(async () => {
        const setConsentEndpointCalled = page.waitForResponse((response) => response.url().includes("/set-consent"));
        await page.evaluate(() => {
          window.__cbapi("handleKey", 2, undefined, 13);
        });
        await setConsentEndpointCalled;
      });

      test("Consent is saved (true)", async () => {
        const tcData = await page.evaluate(
          () =>
            new Promise((resolve) => {
              window.__cmpapi("getTCData", 2, resolve);
            }),
        );
        expect(tcData.vendor.consents).toEqual({ 5050: true, 5051: true });
      });

      describe("When banner is requested again", () => {
        beforeAll(async () => {
          await page.evaluate(() => {
            window.bannerCloseReason = "no-reason";
            window.__cbapi("showAdditionalChannelsBanner", 2, function (consentDecision, reason) {
              window.bannerCloseReason = reason;
              if (typeof consentDecision === "boolean") {
                window.__cmpapi("setConsentByVendorId", 2, undefined, { 5050: consentDecision, 5051: consentDecision });
              }
            });
          });
        });

        describe("And 'Ablehnen' is selected", () => {
          beforeAll(async () => {
            await page.evaluate(() => {
              window.__cbapi("handleKey", 2, console.log, 39);
              window.__cbapi("handleKey", 2, console.log, 13);
            });
          });

          test("banner close reason should be 'noconsent'", async () => {
            const reason = await page.evaluate(() => {
              return Promise.resolve(window.bannerCloseReason);
            });
            expect(reason).toBe("noconsent");
          });
        });

        describe("And red button is pressed", () => {
          beforeAll(async () => {
            await page.evaluate(() => {
              window.bannerCloseReason = "no-reason";
              window.__cbapi("showAdditionalChannelsBanner", 2, function (consentDecision, reason) {
                window.bannerCloseReason = reason;
                if (typeof consentDecision === "boolean") {
                  window.__cmpapi("setConsentByVendorId", 2, undefined, { 5050: consentDecision, 5051: consentDecision });
                }
              });
              window.__cbapi("handleKey", 2, console.log, 403);
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
