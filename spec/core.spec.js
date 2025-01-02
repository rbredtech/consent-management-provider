const { describe, beforeAll, afterAll, test, expect } = require("@jest/globals");
const pageHelper = require("./helper/page");

const cases = [
  [true, true, true], // [withTracking, localStorage, iFrame]
  [true, true, false],
  [true, false, true],
  [true, false, false],
  [false, true, true],
  [false, true, false],
  [false, false, true],
  [false, false, false],
];

describe.each(cases)(
  "Consent Management is loaded - tracking script: %s, localStorage: %s, iFrame: %s",
  (withTracking, localStorage, iFrame) => {
    let page;

    beforeAll(async () => {
      page = await pageHelper.get(!localStorage, !iFrame);
      await page.goto(`${pageHelper.HTTP_PROTOCOL}://${pageHelper.HTTP_HOST}/health`);
      await (withTracking ? pageHelper.initLoaderWithTracking(page) : pageHelper.initLoader(page));
    }, 5000);

    afterAll(async () => {
      await page.browser().close();
    }, 5000);

    test("Ping API call returns basic configuration", async () => {
      const result = page.evaluate(() => {
        return new Promise((resolve) => {
          window.__cmpapi("ping", 2, resolve);
        });
      });

      return expect(result).resolves.toEqual({
        apiVersion: "2.0",
        cmpId: 4040,
        cmpLoaded: true,
        cmpStatus: "loaded",
        cmpVersion: 1,
        displayStatus: "hidden",
        gdprApplies: true,
        gvlVersion: 1,
        tcfPolicyVersion: 2,
      });
    });

    test("Storage status is enabled", async () => {
      const apiResponse = await page.evaluate(
        () =>
          new Promise((resolve) => {
            window.__cmpapi("getTCData", 2, resolve);
          }),
      );

      expect(apiResponse.cmpStatus).toBe("loaded");
      expect(apiResponse.vendor["consents"]).toBeDefined();
      expect(apiResponse.vendor["consents"]["4040"]).toBeUndefined();
      expect(apiResponse.vendor["consents"]["4041"]).toBeUndefined();
    });

    if (withTracking) {
      test("Tracking script api is available", async () => {
        const did = await page.evaluate(
          () =>
            new Promise((resolve) => {
              setTimeout(() => {
                window.__hbb_tracking_tgt.getDID(resolve);
              }, 2000);
            }),
        );
        expect(did).not.toBeUndefined();
      });
    }
  },
);
