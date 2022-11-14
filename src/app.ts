import { readFileSync } from "fs";
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

declare global {
  namespace Express {
    interface Request {
      withBanner: boolean;
    }
  }
}

const getCmpJsTemplateValues = (req: Request) => {
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

  let cmpStatus: "loaded" | "disabled" = "loaded";
  const techCookie: TechCookie = req.cookies[TECH_COOKIE_NAME];
  if (!techCookie || Date.now() - techCookie < TECH_COOKIE_MIN) {
    // if tech cookie doesn't exist or is not old enough, the cmp is
    // disabled. that means no ads or tracking should be used
    cmpStatus = "disabled";
  }

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
        CONSENT: true,
        CONSENT_SERVER_HOST: HTTP_HOST,
        URL_SCHEME: req.protocol,
        BANNER: req.withBanner ? "_with_banner" : "",
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
app.get("/loader_with_banner.js", withBannerMiddleware, loaderHandler);

const iframeHandler = (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html");
  res.setHeader("Cache-Control", "no-store");
  res.render("iframe", {
    CONSENT_SERVER_HOST: HTTP_HOST,
    URL_SCHEME: req.protocol,
    BANNER: req.withBanner ? "_with_banner" : "",
  });
};

app.get("/iframe.html", iframeHandler);
app.get("/iframe_with_banner.html", withBannerMiddleware, iframeHandler);

const managerIframeHandler = async (req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("Cache-Control", "no-store");

  configuredCounterMetric.labels({ type: "iframe" }).inc();

  try {
    const values = getCmpJsTemplateValues(req);
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
  "/manager-iframe_with_banner.js",
  withBannerMiddleware,
  managerIframeHandler
);

const managerHandler = async (req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("Cache-Control", "no-store");

  configuredCounterMetric.labels({ type: "3rd-party" }).inc();

  try {
    const values = getCmpJsTemplateValues(req);
    const cmpJs = await ejs.renderFile(
      path.join(__dirname, "../templates/mini-cmp.ejs"),
      values
    );

    let bannerJs: string | undefined = undefined;
    if (req.withBanner) {
      bannerJs = await ejs.renderFile(
        path.join(__dirname, ".../templates/banner.ejs")
      );
    }

    const cmpJsMinified = minify(bannerJs ? [cmpJs, bannerJs] : cmpJs);
    if (cmpJsMinified.error) {
      res.status(500).send(cmpJsMinified.error);
      return;
    }
    res.send(cmpJsMinified.code);
  } catch (e) {
    res.status(500).send(e);
  }
};

app.get(["/manager.js", "/mini-cmp.js"], managerHandler);
app.get("/manager_with_banner.js", withBannerMiddleware, managerHandler);

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

app.get("/remove-consent", (req, res) => {
  consentCounterMetric.labels({ consent: "remove" }).inc();

  res.cookie(COOKIE_NAME, "{}", {
    maxAge: 0,
    domain: COOKIE_DOMAIN,
  });
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
