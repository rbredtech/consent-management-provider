const puppeteer = require("puppeteer");

const HTTP_HOST = process.env.HTTP_HOST || "localhost:8080";
const HTTP_PROTOCOL = process.env.HTTP_PROTOCOL || "http";
const API_VERSION = process.env.API_VERSION || "v2";

async function get() {
  const browser = await puppeteer.launch({ dumpio: false, args: ["--disable-gpu"] });
  const page = await browser.newPage();
  return page;
}

async function initLoader(page, channelId = undefined, withBanner = false) {
  await page.setContent(
    `<script type='text/javascript' src="${HTTP_PROTOCOL}://${HTTP_HOST}/${API_VERSION}/cmp.js${
      channelId !== undefined ? "?channelId=" + channelId : ""
    }"></script>${
      withBanner
        ? `<script type='text/javascript' src="${HTTP_PROTOCOL}://${HTTP_HOST}/${API_VERSION}/banner.js${
            channelId !== undefined ? "?channelId=" + channelId : ""
          }"></script>`
        : ""
    }`,
  );
  const isLoaded = page.waitForFunction(() => document.readyState === "complete");
  return isLoaded;
}

module.exports = { get, initLoader, HTTP_HOST, HTTP_PROTOCOL };
