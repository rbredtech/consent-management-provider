const { describe, beforeAll, afterAll, test, expect } = require("@jest/globals");
const pageHelper = require("./helper/page");
const { HTTP_PROTOCOL } = require("./helper/page");

let page;

beforeAll(async () => {
  page = await pageHelper.get();
  await page.goto(`${HTTP_PROTOCOL}://${pageHelper.HTTP_HOST}/health`);
  await page.evaluate(
    () =>
      new Promise((resolve) => {
        window.atob = null;
        window.JSON = null;
        window.Object.keys = null;
        resolve();
      }),
  );
  await pageHelper.initLoader(page);
}, 20000);

afterAll(async () => {
  await page.browser().close();
}, 20000);

describe("Polyfills", () => {
  test("verify native APIs are not available", async () => {
    const nativeApis = await page.evaluate(
      () =>
        new Promise((resolve) => {
          resolve([window.JSON, window.atob, window.Object.keys]);
        }),
    );
    expect(nativeApis).toEqual([null, null, null]);
  });

  describe("Object.keys polyfill (window.objectKeys)", () => {
    test("should return string array with object keys", async () => {
      const keys = await page.evaluate(
        () =>
          new Promise((resolve) => {
            resolve(window.objectKeys({ a: 1, b: "test", "got.fun": true, 5: false }));
          }),
      );
      expect(keys).toEqual(Object.keys({ a: 1, b: "test", "got.fun": true, 5: false }));
    });
  });

  describe("atob polyfill (window.decodeCookie)", () => {
    test("should decode base64 encoded value correctly", async () => {
      const decodedValue = await page.evaluate(
        () =>
          new Promise((resolve) => {
            resolve(window.cookieDecode("VFYtSW5zaWdodA=="));
          }),
      );
      expect(decodedValue).toEqual(atob("VFYtSW5zaWdodA=="));
    });

    test("should decode consent from cookie correctly", async () => {
      const decodedConsent = await page.evaluate(
        () =>
          new Promise((resolve) => {
            resolve(window.cookieDecode("eyJjb25zZW50IjoiNDA0MH5mYWxzZSw0MDQxfmZhbHNlIn0="));
          }),
      );
      expect(decodedConsent).toEqual('{"consent":"4040~false,4041~false"}');
    });
  });

  describe("JSON.stringify polyfill (window.jsonStringify)", () => {
    test("should create correct string representation of object", async () => {
      const stringified = await page.evaluate(
        () =>
          new Promise((resolve) => {
            resolve(
              window.jsonStringify({
                name: "Zwonimir",
                number: 29,
                infinity: Infinity,
                boolean: true,
                null: null,
                undefined: undefined,
                nAn: NaN,
                stringArray: ["html", "css", "react"],
                numberArray: [1, 2, 3],
                object: {
                  city: "Salzburg",
                  state: "Salzburg",
                  zip: 5023,
                  anotherArray: ["test", 1],
                },
              }),
            );
          }),
      );
      expect(stringified).toEqual(
        JSON.stringify({
          name: "Zwonimir",
          number: 29,
          infinity: Infinity,
          boolean: true,
          null: null,
          undefined: undefined,
          nAn: NaN,
          stringArray: ["html", "css", "react"],
          numberArray: [1, 2, 3],
          object: {
            city: "Salzburg",
            state: "Salzburg",
            zip: 5023,
            anotherArray: ["test", 1],
          },
        }),
      );
    });
  });

  describe("JSON.parse polyfill (window.jsonParse)", () => {
    test("should parse string representation of object correctly", async () => {
      const parsed = await page.evaluate(
        () =>
          new Promise((resolve) => {
            resolve(
              window.jsonParse(
                '{"name":"Zwonimir","number":29,"infinity":null,"boolean":true,"null":null,"nAn":null,"stringArray":["html","css","react"],"numberArray":[1,2,3],"object":{"city":"Salzburg","state":"Salzburg","zip":5023,"anotherArray":["test",1]}}',
              ),
            );
          }),
      );
      expect(parsed).toEqual(
        JSON.parse(
          '{"name":"Zwonimir","number":29,"infinity":null,"boolean":true,"null":null,"nAn":null,"stringArray":["html","css","react"],"numberArray":[1,2,3],"object":{"city":"Salzburg","state":"Salzburg","zip":5023,"anotherArray":["test",1]}}',
        ),
      );
    });
  });
});
