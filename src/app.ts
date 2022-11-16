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

const hasConsent = (parameterConsent: string | undefined, cookieConsent: boolean | undefined): boolean | undefined => {
  let consent = undefined;

  if (parameterConsent !== undefined) {
    consent = parameterConsent === "true";
  } else if (cookieConsent !== undefined) {
    consent = cookieConsent;
  }

  return consent;
}

const getCmpJsTemplateValues = (req: Request) => {
  let cookie: ConsentCookie | undefined;
  let tcConsent: boolean | undefined;
  const parameterConsent: string | undefined = req.query["consent"]?.toString() ?? undefined;
  const parameterXt: string | undefined = req.query["xt"]?.toString() ?? undefined;

  if (req.cookies[COOKIE_NAME]) {
    try {
      cookie = JSON.parse(
        Buffer.from(req.cookies[COOKIE_NAME], "base64").toString()
      );
    } catch (e) {
      logger.info(`Error parsing cookie ${COOKIE_NAME}`, e);
    }
  }

  tcConsent = hasConsent(parameterConsent, cookie?.consent)
  logger.debug(
      `Cookie=${cookie?.consent}; Parameter=${parameterConsent}; Consent=${tcConsent}`
  );

  let cmpStatus: "loaded" | "disabled" = "disabled";
  const techCookie: TechCookie = req.cookies[TECH_COOKIE_NAME];

  if (techCookie && Date.now() - techCookie >= TECH_COOKIE_MIN) {
    // if the tech cookie is set and is old enough, the cmp is
    // enabled
    cmpStatus = "loaded";
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
    COOKIE_NAME,
    CONSENT_SERVER_HOST: HTTP_HOST,
    URL_SCHEME: req.protocol,
    BANNER: req.withBanner ? "-with-banner" : "",
  });
};

app.get("/iframe.html", iframeHandler);
app.get("/iframe-with-banner.html", withBannerMiddleware, iframeHandler);

const managerIframeHandler = async (req: Request, res: Response) => {
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

    res.setHeader("Content-Type", "application/javascript");
    res.setHeader("Cache-Control", "no-store");
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
app.get("/manager-with-banner.js", withBannerMiddleware, managerHandler);

app.get("/set-consent", async (req, res) => {
  const consent = req.query?.consent === "1";
  const cookie: ConsentCookie = {
    consent
  };

  consentCounterMetric.labels({ consent: cookie.consent.toString() }).inc();

  try {
    console.log(consent);
    const content = await ejs.renderFile(
        path.join(__dirname, "../templates/set-consent.ejs"),
        {
          COOKIE_NAME,
          CONSENT: consent
        }
    );

    console.log(consent);
    const contentMinified = minify(content);
    if (contentMinified.error) {
      res.status(500)
          .send(contentMinified.error);
      return;
    }
    res.cookie(
        COOKIE_NAME,
        Buffer.from(JSON.stringify(cookie))
            .toString("base64"),
        {
          maxAge: COOKIE_MAXAGE,
          domain: COOKIE_DOMAIN,
        }
    );
    res.setHeader("Content-Type", "application/javascript");
    res.setHeader("Cache-Control", "no-store");
    res.send(contentMinified.code);
  } catch (e) {
    console.error(e);
    res.status(500)
        .send(e);
  }
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
