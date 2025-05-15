const pageHelper = require("./helper/page");

let page;

beforeAll(async () => {
  page = await pageHelper.get();
  await page.evaluate(
    () =>
      new Promise((resolve) => {
        window.atob = null;
        window.btoa = null;
        window.JSON = null;
        resolve();
      }),
  );
}, 20000);

afterAll(async () => {
  await page.browser().close();
}, 20000);

describe("Polyfills", () => {
  describe("setup", () => {
    test("verify native APIs are not available", async () => {
      const nativeApis = await page.evaluate(
        () =>
          new Promise((resolve) => {
            resolve([window.JSON, window.atob, window.btoa]);
          }),
      );
      expect(nativeApis).toEqual([null, null, null]);
    });
  });

  describe("test", () => {
    beforeAll(async () => {
      await pageHelper.init(page);
    });

    describe("btoa polyfill (window.cookieEncode)", () => {
      test("should encode value correctly", async () => {
        const decodedValue = await page.evaluate(
          () =>
            new Promise((resolve) => {
              resolve(window.cookieEncode("abcd"));
            }),
        );
        expect(decodedValue).toEqual(btoa("abcd"));
      });

      test("should encode consent cookie correctly", async () => {
        const encodedConsent = await page.evaluate(
          () =>
            new Promise((resolve) => {
              resolve(window.cookieEncode('{"consent":"4040~false,4041~false"}'));
            }),
        );
        expect(encodedConsent).toEqual("eyJjb25zZW50IjoiNDA0MH5mYWxzZSw0MDQxfmZhbHNlIn0=");
      });
    });

    describe("atob polyfill (window.cookieDecode)", () => {
      test("should decode base64 encoded value correctly", async () => {
        const decodedValue = await page.evaluate(
          () =>
            new Promise((resolve) => {
              resolve(window.cookieDecode("eW91X211c3RfYmVfcmVhbGx5X2Rlc3BhcmF0ZQ=="));
            }),
        );
        expect(decodedValue).toEqual(atob("eW91X211c3RfYmVfcmVhbGx5X2Rlc3BhcmF0ZQ=="));
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
});
