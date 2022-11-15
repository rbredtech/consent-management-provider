import path from "path";

import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Request, Response } from "express";
import ejs from "ejs";

import {
  HTTP_HOST,
  HTTP_PORT,
  COOKIE_DOMAIN,
  COOKIE_NAME,
  COOKIE_MAXAGE,
  TECH_COOKIE_MIN,
  TECH_COOKIE_NAME,
  BANNER_TIMEOUT,
  CMP_ENABLED_SAMPLING_THRESHOLD_PERCENT,
} from "./config";
import { minify } from "./util/minify";
import { logger } from "./util/logger";
import {
  configuredCounterMetric,
  consentCounterMetric,
  loadedCounterMetric,
  registry,
} from "./util/metrics";

import { loggerMiddleware } from "./middleware/logger";
import { TechCookie, techCookieMiddleware } from "./middleware/techCookie";
import { withBannerMiddleware } from "./middleware/withBanner";

interface ConsentCookie {
  consent: boolean;
}

const getCmpJsTemplateValues = (req: Request): { [key:string]: any } => {
  let cookie: ConsentCookie | undefined;
  if (req.cookies[COOKIE_NAME]) {
    try {
      cookie = JSON.parse(
        Buffer.from(req.cookies[COOKIE_NAME], "base64").toString()
      );
    } catch (e) {
      logger.info(`Error parsing cookie ${COOKIE_NAME}`, e);
    }
  }
  logger.debug(
    `hasCookie=${cookie !== undefined}; hasConsent=${cookie?.consent}`
  );

  let tcConsent: boolean | undefined;
  if (cookie) {
    tcConsent = cookie?.consent ?? false;
  }
  if (req.params.consent) {
    // consent from url param comes from localStorage on device and takes preference over cookie
    logger.debug(`consent in url param found ${req.params.consent}`);
    if (req.params.consent === 'false') tcConsent = false;
    if (req.params.consent === 'true') tcConsent = true;
  }

  let cmpStatus: "loaded" | "disabled" = "disabled";
  const techCookie: TechCookie = req.cookies[TECH_COOKIE_NAME];

  if (techCookie && Date.now() - techCookie >= TECH_COOKIE_MIN) {
    // if the tech cookie is set and is old enough, the cmp is
    // enabled
    cmpStatus = "loaded";
  }

  if (cmpStatus === "loaded"
    && Math.floor(Math.random() * 101) > CMP_ENABLED_SAMPLING_THRESHOLD_PERCENT) {

    // request randomly choosen to be outside the configured sampling threshold,
    // so disable consent status
    cmpStatus = "disabled";
  }

  if (cmpStatus === "loaded") logger.debug("enable consent status for this request");

  return {
    TC_STRING: "tcstr",
    CMP_STATUS: cmpStatus,
    TC_CONSENT: tcConsent ?? "undefined",
    CONSENT_SERVER_HOST: HTTP_HOST,
    URL_SCHEME: req.protocol,
  };
};

const app = express();

app.use(cors());
app.use(cookieParser());
app.set("views", path.join(__dirname, "../templates"));
app.set("view engine", "ejs");

app.use(loggerMiddleware);
app.use(techCookieMiddleware);

const loaderHandler = async (req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("Cache-Control", "no-store");

  loadedCounterMetric.inc();

  try {
    const loaderJs = await ejs.renderFile(
      path.join(__dirname, "../templates/loader.ejs"),
      {
        XT: req.timestamp,
        CONSENT_SERVER_HOST: HTTP_HOST,
        URL_SCHEME: req.protocol,
        BANNER: req.withBanner ? "-with-banner" : "",
      }
    );

    const loaderJsMinified = minify(loaderJs);
    if (loaderJsMinified.error) {
      res.status(500).send(loaderJsMinified.error);
      return;
    }

    res.send(loaderJsMinified.code);
  } catch (e) {
    res.status(500).send(e);
  }
};

app.get("/loader.js", loaderHandler);
app.get("/loader-with-banner.js", withBannerMiddleware, loaderHandler);

const iframeHandler = (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html");
  res.setHeader("Cache-Control", "no-store");
  res.render("iframe", {
    XT: req.timestamp, // TODO
    CONSENT_SERVER_HOST: HTTP_HOST,
    URL_SCHEME: req.protocol,
    BANNER: req.withBanner ? "-with-banner" : "",
  });
};

app.get("/iframe.html", iframeHandler);
app.get("/iframe-with-banner.html", withBannerMiddleware, iframeHandler);

const managerIframeHandler = async (req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("Cache-Control", "no-store");

  configuredCounterMetric.labels({ type: "iframe" }).inc();

  try {
    const values = getCmpJsTemplateValues(req);
    values.BANNER_NO_IFRAME = '';
    const cmpJs = await ejs.renderFile(
      path.join(__dirname, "../templates/mini-cmp.ejs"),
      values
    );
    const iframeMsgJs = await ejs.renderFile(
      path.join(__dirname, "../templates/iframe-msg.ejs"),
      { BANNER_TIMEOUT }
    );

    let bannerJs: string | undefined = undefined;
    if (req.withBanner) {
      bannerJs = await ejs.renderFile(
        path.join(__dirname, "../templates/banner.ejs")
      );
    }

    const combinedMinified = minify(
      bannerJs ? [cmpJs, iframeMsgJs, bannerJs] : [cmpJs, iframeMsgJs]
    );

    if (combinedMinified.error) {
      res.status(500).send(combinedMinified.error);
      return;
    }

    res.send(combinedMinified.code);
  } catch (e) {
    res.status(500).send(e);
  }
};

app.get("/manager-iframe.js", managerIframeHandler);
app.get(
  "/manager-iframe-with-banner.js",
  withBannerMiddleware,
  managerIframeHandler
);

const managerHandler = async (req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("Cache-Control", "no-store");

  configuredCounterMetric.labels({ type: "3rd-party" }).inc();

  try {
    const values = getCmpJsTemplateValues(req);

    let bannerJs: string | undefined = undefined;
    let kbdJs: string | undefined = undefined;

    // add showBanner if needed
    if (req.withBanner) {
      values.BANNER_NO_IFRAME = await ejs.renderFile(
        path.join(__dirname, "../templates/show-banner-cmd.ejs"),
        { BANNER_TIMEOUT }
      );
      bannerJs = await ejs.renderFile(
        path.join(__dirname, "../templates/banner.ejs")
      );
      kbdJs = await ejs.renderFile(path.join(__dirname, "../templates/kbd.ejs"));
    } else {
      values.BANNER_NO_IFRAME = '';
    }
    const cmpJs = await ejs.renderFile(
      path.join(__dirname, "../templates/mini-cmp.ejs"),
      values
    );

    const cmpJsMinified = minify(bannerJs && kbdJs ? [bannerJs, kbdJs, cmpJs] : cmpJs);
    if (cmpJsMinified.error) {
      res.status(500).send(cmpJsMinified.error);
      return;
    }
    res.send(cmpJsMinified.code);
  } catch (e) {
    logger.error(e);
    res.status(500).send(e);
  }
};

app.get(["/manager.js", "/mini-cmp.js"], managerHandler);
app.get("/manager-with-banner.js", withBannerMiddleware, managerHandler);

app.get("/set-consent", (req, res) => {
  const cookie: ConsentCookie = {
    consent: req.query?.consent === "1",
  };

  consentCounterMetric.labels({ consent: cookie.consent.toString() }).inc();

  res.cookie(
    COOKIE_NAME,
    Buffer.from(JSON.stringify(cookie)).toString("base64"),
    {
      maxAge: COOKIE_MAXAGE,
      domain: COOKIE_DOMAIN,
    }
  );
  res.setHeader("Cache-Control", "no-store");
  res.sendStatus(200);
});

app.get("/metrics", async (req, res) => {
  res
    .status(200)
    .contentType(registry.contentType)
    .send(await registry.metrics());
});

app.get("/health", async (req, res) => {
  const healthcheck = {
    uptime: process.uptime(),
    message: "OK",
    timestamp: Date.now(),
  };

  res.status(200).send(healthcheck);
});

app.listen(HTTP_PORT);
logger.info(`listening on port ${HTTP_PORT}`);
