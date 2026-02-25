const puppeteer = require("puppeteer");

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

const TEST_DID = "00000000-0000-0000-0000-000000000001";

async function init(page, agfBanner = false) {
  await page.goto("http://local.client.com:5555");
  await page.setContent(
    `<!DOCTYPE html PUBLIC '-//HbbTV//1.1.1//EN' 'http://www.hbbtv.org/dtd/HbbTV-1.1.1.dtd'>
    <html xmlns='http://www.w3.org/1999/xhtml'>
    <head>
      <meta http-equiv='content-type' content='application/vnd.hbbtv.xhtml+xml; charset=utf-8' />
      <script>window.__hbb_tracking_tgt = { getDID: function(cb) { cb('${TEST_DID}'); } };</script>
      <script type='text/javascript' src='http://local.consent.com:3000/cmp.js'></script>
      <script type='text/javascript' src='http://local.consent.com:3000/${agfBanner ? "banner-agf.js" : "banner.js"}'></script>
    </head>
    <body></body>
    </html>`,
  );
}

module.exports = { get, init };
