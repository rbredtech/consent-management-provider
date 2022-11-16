import { Request } from "express";

import {
  HTTP_HOST,
  COOKIE_NAME,
  TECH_COOKIE_MIN,
  TECH_COOKIE_NAME,
  CMP_ENABLED_SAMPLING_THRESHOLD_PERCENT,
  CMP_ENABLED,
} from "../../config";

import { logger } from "../../util/logger";

export const getTemplateValues = (req: Request): { [key: string]: any } => {
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
    if (req.params.consent === "false") tcConsent = false;
    if (req.params.consent === "true") tcConsent = true;
  }

  let cmpStatus: "loaded" | "disabled" = "disabled";

  if (
    CMP_ENABLED &&
    req.timestamp &&
    Date.now() - req.timestamp >= TECH_COOKIE_MIN
  ) {
    // if the tech cookie is set and is old enough, the cmp is enabled
    cmpStatus = "loaded";
  }

  if (
    cmpStatus === "loaded" &&
    Math.floor(Math.random() * 101) > CMP_ENABLED_SAMPLING_THRESHOLD_PERCENT
  ) {
    // request randomly choosen to be outside the configured sampling threshold,
    // so disable consent status
    cmpStatus = "disabled";
  }

  if (cmpStatus === "loaded")
    logger.debug("enable consent status for this request");

  return {
    XT: req.timestamp,
    TC_STRING: "tcstr",
    CMP_STATUS: cmpStatus,
    TC_CONSENT: tcConsent ?? "undefined",
    CONSENT_SERVER_HOST: HTTP_HOST,
    URL_SCHEME: req.protocol,
    CHANNEL_ID: req.query.channelId ? req.query.channelId.toString() : "",
  };
};
