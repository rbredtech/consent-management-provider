const puppeteer = require("puppeteer");
const HTTP_HOST = process.env.HTTP_HOST || "localhost:8080";
const HTTP_PROTOCOL = process.env.HTTP_PROTOCOL || "http";
const API_VERSION = process.env.API_VERSION || "v2";

async function get() {
    const browser = await puppeteer.launch({dumpio: false, args: ['--disable-gpu']});
    const page = await browser.newPage();
    page.on('request', request => console.log(request.url()));
    page.on('response', response => console.log(response.url(), response.status()));

    return page;
}

async function initLoader(page, channelId = undefined, withBanner = false) {
    const isLoaded = page.waitForResponse(response => response.url().includes('manager-iframe'));
    await page.setContent(`<script type='text/javascript' src="${HTTP_PROTOCOL}://${HTTP_HOST}/${API_VERSION}/loader${withBanner ? "-with-banner" : ""}.js${channelId !== undefined ? "?channelId=" + channelId : ""}"></script>`);
    return isLoaded;
}

module.exports = {get, initLoader, HTTP_HOST, HTTP_PROTOCOL};
