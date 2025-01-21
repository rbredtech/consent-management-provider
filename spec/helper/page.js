const puppeteer = require("puppeteer");

const HTTP_HOST = process.env.HTTP_HOST || "localhost:8080";
const HTTP_PROTOCOL = process.env.HTTP_PROTOCOL || "http";
const API_VERSION = process.env.API_VERSION;

async function get(disableLocalStorage) {
  const args = ["--disable-gpu", "--no-sandbox"];
  if (disableLocalStorage) {
    args.push("--disable-local-storage");
  }
  const browser = await puppeteer.launch({ dumpio: false, args });
  const page = await browser.newPage();
  return page;
}

async function initLoader(page, channelId = 9999, withBanner = false) {
  let pageContent = `<script type='text/javascript' src="${HTTP_PROTOCOL}://${HTTP_HOST}${API_VERSION ? `/${API_VERSION}/` : "/"}cmp.js?channelId=${channelId}"></script>`;
  if (withBanner) {
    pageContent += `<script type='text/javascript' src="${HTTP_PROTOCOL}://${HTTP_HOST}${API_VERSION ? `/${API_VERSION}/` : "/"}banner.js?channelId=${channelId}"></script>`;
  }
  await page.setContent(pageContent);
  await page.waitForFunction(() => document.readyState === "complete");
}

async function initLoaderWithTracking(page, channelId = 9999, withBanner = false) {
  let pageContent = `<script type='text/javascript' src="${HTTP_PROTOCOL}://${HTTP_HOST}${API_VERSION ? `/${API_VERSION}/` : "/"}cmp-with-tracking.js?channelId=${channelId}&cmpId=4040"></script>`;
  if (withBanner) {
    pageContent += `<script type='text/javascript' src="${HTTP_PROTOCOL}://${HTTP_HOST}${API_VERSION ? `/${API_VERSION}/` : "/"}banner.js?channelId=${channelId}"></script>`;
  }
  await page.setContent(pageContent);
  await page.waitForFunction(() => document.readyState === "complete");
}

module.exports = { get, initLoader, initLoaderWithTracking, HTTP_HOST, HTTP_PROTOCOL };
