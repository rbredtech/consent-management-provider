const puppeteer = require("puppeteer");
const HTTP_HOST = process.env.HTTP_HOST || "localhost:8080";
const API_VERSION = process.env.API_VERSION || "v2";

async function get() {
    const browser = await puppeteer.launch({dumpio: true, args: ['--disable-gpu']});
    const page = await browser.newPage();
    page.on('request', request => console.log(request.url()));
    page.on('response', response => console.log(response.url(), response.status()));

    return page;
}

async function initLoader(page) {
    const isLoaded = page.waitForResponse(response => response.url().includes('manager-iframe.js'));
    await page.setContent(`<script type='text/javascript' src="http://${HTTP_HOST}/${API_VERSION}/loader.js"></script>`);
    return isLoaded;
}

module.exports = {get, initLoader, HTTP_HOST};
