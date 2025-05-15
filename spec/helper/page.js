const puppeteer = require("puppeteer");

async function get(disableLocalStorage, disableIframe) {
  const args = ["--disable-gpu", "--no-sandbox"];
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

async function init(page) {
  await page.goto("http://localhost:5555/jest.html", { waitUntil: "networkidle0" });
}

module.exports = { get, init };
