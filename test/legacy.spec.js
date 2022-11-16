const { describe, beforeAll, afterAll, test, expect } = require("@jest/globals");
let puppeteer = require("puppeteer");

let browser, page;

const scriptUrl = `http://127.0.0.1:3000/mini-cmp.js`;

beforeAll(async () => {
    browser = await puppeteer.launch({dumpio: true, args: ['--disable-gpu']});
    page = await browser.newPage();
    page.on('request', request => console.log(request.url()));
    page.on('response', response => console.log(response.url()));
}, 20000);


afterAll(async () => {
    await browser.close();
}, 20000);

describe("Consent Management", () => {
    let isLoaded;

    beforeAll( async () => {
        isLoaded = page.waitForResponse(response => response.url().includes('mini-cmp.js'));
        await page.setContent(`<script type='text/javascript' src="${scriptUrl}"></script>`);
    });

    describe("Content is loaded", () => {
        beforeAll( async () => {
            await isLoaded;
        });

        test("Ping API call returns basic configuration", async () => {
            const result = page.evaluate(`(new Promise((resolve)=>{window.__tcfapi('ping', 1, resolve)}))`);

            return expect(result).resolves.toEqual({"apiVersion": "2.0", "cmpId": 4040, "cmpLoaded": true, "cmpStatus": "loaded", "cmpVersion": 1, "displayStatus": "hidden", "gdprApplies": true, "gvlVersion": 1, "tcfPolicyVersion": 2});
        });
    });
});