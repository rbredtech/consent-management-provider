const {
    describe,
    beforeAll,
    test,
    expect,
    afterAll
} = require("@jest/globals");
const puppeteer = require("puppeteer");

const consentLoader = {
    PROTOCOL: process.env.CONSENT_LOADER_PROTOCOL || 'http',
    HOST: process.env.CONSENT_LOADER_HOST || 'localhost',
    PORT: process.env.CONSENT_LOADER_PORT || '8080'
};
let browser,
    page;

beforeAll(async () => {
    browser = await puppeteer.launch({
        dumpio: true,
        args: ['--disable-gpu']
    });
    page = await browser.newPage();
    page.on('request', request => console.log(request.url()));
    page.on('response', response => console.log(response.url()));
});

afterAll(async () => {
    await browser.close();
}, 20000);

describe("Consent Management with technical cookie", () => {
    beforeAll(async () => {

        await page.goto(`${consentLoader.PROTOCOL}://${consentLoader.HOST}:${consentLoader.PORT}/loader.js`);
        await page.setCookie({
            value: (Date.now() - 3600000 * 25).toString(),
            expires: Date.now() + 3600 * 1,
            domain: consentLoader.HOST,
            name: "xt"
        });
        await page.evaluate(`localStorage.setItem("xt", "${Date.now() - 3600000 * 25}");`);
        // page = await browser.newPage();
    });

    describe("Is loaded", () => {
        beforeAll(async () => {
            const isLoaded = page.waitForResponse(response => response.url()
                .includes('manager-iframe'));
            await page.setContent(`<script type='text/javascript' src="${consentLoader.PROTOCOL}://${consentLoader.HOST}:${consentLoader.PORT}/loader.js"></script>`);
            await isLoaded;
        });

        test("Storage status is enabled", async () => {
            const result = page.evaluate(`(new Promise((resolve)=>{window.__tcfapi('getTCData', 1, resolve)}))`);
            const status = await result;

            expect(status.cmpStatus)
                .toBe("disabled");
            expect(status.tcString)
                .toBe("tcstr");
            expect(status.tcfPolicyVersion)
                .toBe(2);
        });
    });
});
