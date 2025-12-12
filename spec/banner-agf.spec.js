const pageHelper = require("./helper/page");

const cases = [
  [true, true], // [localStorage, iFrame]
  [true, false],
  [false, true],
  [false, false],
];

describe.each(cases)("Consent banner (AGF) - localStorage: %s, iFrame: %s", (localStorage, iFrame) => {
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
        window.__cbapi("showBanner", 2, function (consentDecision) {
          if (typeof consentDecision === "boolean") {
            window.__cmpapi("setConsentByVendorId", 2, undefined, { 5050: consentDecision });
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

    describe("When OK button is hit", () => {
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
        expect(tcData.vendor.consents).toEqual({ 5050: true });
      });

      describe("When banner is requested again", () => {
        beforeAll(async () => {
          await page.evaluate(() => {
            window.__cbapi("showBanner", 2, function (consentDecision) {
              if (typeof consentDecision === "boolean") {
                window.__cmpapi("setConsentByVendorId", 2, undefined, { 5050: consentDecision });
              }
            });
          });
        });

        describe("And Dismiss is selected", () => {
          beforeAll(async () => {
            const setConsentEndpointCalled = page.waitForResponse((response) => response.url().includes("/set-consent"));
            await page.evaluate(() => {
              window.__cbapi("handleKey", 2, undefined, 37);
              window.__cbapi("handleKey", 2, undefined, 13);
            });
            await setConsentEndpointCalled;
          });

          test("Consent revoke is saved (false)", async () => {
            const tcData = await page.evaluate(
              () =>
                new Promise((resolve) => {
                  window.__cmpapi("getTCData", 2, resolve);
                }),
            );
            expect(tcData.vendor.consents).toEqual({ 5050: false });
          });
        });
      });
    });
  });
});
