const puppeteer = require("puppeteer");

const CONSENT_HOST = process.env.CONSENT_HOST || "localhost:8000";
const HTTP_PROTOCOL = process.env.HTTP_PROTOCOL || "http";
const VERSION_PATH = process.env.VERSION_PATH;

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
  await page.goto(`${HTTP_PROTOCOL}://${CONSENT_HOST}/health`);

  await page.setContent(
    `<!DOCTYPE html PUBLIC '-//HbbTV//1.1.1//EN' 'http://www.hbbtv.org/dtd/HbbTV-1.1.1.dtd'>
    <html xmlns='http://www.w3.org/1999/xhtml'>
    <head>
      <meta http-equiv='content-type' content='application/vnd.hbbtv.xhtml+xml; charset=utf-8' />
      ${
        withTracking
          ? `<script type='text/javascript' src="${HTTP_PROTOCOL}://${CONSENT_HOST}${VERSION_PATH ? `/${VERSION_PATH}/` : "/"}cmp-with-tracking.js?channelId=${channelId}&cmpId=4040"></script>`
          : `<script type='text/javascript' src="${HTTP_PROTOCOL}://${CONSENT_HOST}${VERSION_PATH ? `/${VERSION_PATH}/` : "/"}cmp.js?channelId=${channelId}"></script>`
      }
      ${withBanner ? `<script type='text/javascript' src='http://localhost:3000/${agfBanner ? "banner-agf.js" : "banner.js"}'></script>` : ""}
    </head>
    <body></body>
    </html>`,
  );
}

module.exports = { get, init, CONSENT_HOST, HTTP_PROTOCOL };
