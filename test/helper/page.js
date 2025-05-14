const puppeteer = require("puppeteer");

const HTTP_HOST = "localhost:833";
const HTTP_PROTOCOL = "http";

async function get(disableLocalStorage, disableIframe) {
  const args = ["--disable-gpu", "--no-sandbox"];
  if (disableLocalStorage) {
    args.push("--disable-local-storage");
  }
  const browser = await puppeteer.launch({ dumpio: false, args });
  const page = await browser.newPage();
  if (disableIframe) {
    await page.setUserAgent("HbbTV/1.1.1 (+PVR;Humax;HD FOX+;1.00.20;1.0;)CE-HTML/1.0 ANTGalio/3.3.0.26.03");
  }
  return page;
}

async function initLoader(page, channelId = 9999, withBanner = false) {
  let pageContent = `<script type='text/javascript' src="${HTTP_PROTOCOL}://${HTTP_HOST}/cmp.js?channelId=${channelId}"></script>`;
  if (withBanner) {
    pageContent += `<script type='text/javascript' src="${HTTP_PROTOCOL}://${HTTP_HOST}/banner.js?channelId=${channelId}"></script>`;
  }
  await page.setContent(pageContent);
  await page.waitForFunction(() => document.readyState === "complete");
}

module.exports = { get, initLoader, HTTP_HOST, HTTP_PROTOCOL };
