let describe = require("@jest/globals").describe;
let beforeAll = require("@jest/globals").beforeAll;
let test = require("@jest/globals").test;
let expect = require("@jest/globals").expect;
let puppeteer = require("puppeteer");
const { wait } = require("../helper/util");
const { response } = require("express");
let browser, page;

const scriptUrl = `http://127.0.0.1:3000/mc.js`;

beforeAll(async () => {
    browser = await puppeteer.launch({dumpio: true, args: ['--disable-gpu']});
    page = await browser.newPage();
    page.on('request', request => console.log(request.url()));
    page.on('response', response => console.log(response.url()));
}, 20000);

describe("Consent Management", () => {
    let isLoaded;

    beforeAll( async () => {
        isLoaded = page.waitForResponse(response => response.url().includes('mc-iframe.js'));
        await page.setContent(`<script type='text/javascript' src="${scriptUrl}"></script>`);
    });

    describe("Content is loaded", () => {
        beforeAll( async () => {
            await isLoaded;
        });

        test("Ping API call returns basic configuration", async () => {
            const result = await page.evaluate(`(new Promise((resolve)=>{window.__tcfapi('ping', 1, resolve)}))`);

            expect(await result).toEqual({"apiVersion": "2.0", "cmpId": 4040, "cmpLoaded": true, "cmpStatus": "loaded", "cmpVersion": 1, "displayStatus": "hidden", "gdprApplies": true, "gvlVersion": 1, "tcfPolicyVersion": 2});
        });
    });
});
