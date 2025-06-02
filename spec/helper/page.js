const puppeteer = require("puppeteer");

const HTTP_HOST = process.env.HTTP_HOST || "localhost:8000";
const HTTP_PROTOCOL = process.env.HTTP_PROTOCOL || "http";
const API_VERSION = process.env.API_VERSION;

async function get(disableLocalStorage, disableIframe) {
  const args = ["--no-sandbox", "--disable-setuid-sandbox"];
  if (disableLocalStorage) {
    args.push("--disable-local-storage");
  }
  const browser = await puppeteer.launch({ args });
  const page = await browser.newPage();
  if (disableIframe) {
    await page.setUserAgent("HbbTV/1.1.1 (+PVR;Humax;HD FOX+;1.00.20;1.0;)CE-HTML/1.0 ANTGalio/3.3.0.26.03");
  }
  return page;
}

async function init(page, channelId = 9999, withBanner = false, agfBanner = false, withTracking = false) {
  await page.goto(`${HTTP_PROTOCOL}://${HTTP_HOST}/health`);

  await page.setContent(
    `<!DOCTYPE html PUBLIC '-//HbbTV//1.1.1//EN' 'http://www.hbbtv.org/dtd/HbbTV-1.1.1.dtd'>
    <html xmlns='http://www.w3.org/1999/xhtml'>
    <head>
      <meta http-equiv='content-type' content='application/vnd.hbbtv.xhtml+xml; charset=utf-8' />
      ${
        withTracking
          ? `<script type='text/javascript' src="${HTTP_PROTOCOL}://${HTTP_HOST}${API_VERSION ? `/${API_VERSION}/` : "/"}cmp-with-tracking.js?channelId=${channelId}&cmpId=4040"></script>`
          : `<script type='text/javascript' src="${HTTP_PROTOCOL}://${HTTP_HOST}${API_VERSION ? `/${API_VERSION}/` : "/"}cmp.js?channelId=${channelId}"></script>`
      }
      ${withBanner ? `<script type='text/javascript' src='http://localhost:3000/${agfBanner ? "banner-agf.js" : "banner.js"}'></script>` : ""}
    </head>
    <body></body>
    </html>`,
  );
}

module.exports = { get, init, HTTP_HOST, HTTP_PROTOCOL };
