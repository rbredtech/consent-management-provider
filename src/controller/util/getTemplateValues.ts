import { Request } from "express";

import {
  HTTP_HOST,
  COOKIE_NAME,
  COOKIE_NAME_ADDITIONAL_CHANNELS,
  TECH_COOKIE_MIN,
  CMP_ENABLED_SAMPLING_THRESHOLD_PERCENT,
  CMP_ENABLED,
  API_VERSION,
  BANNER_TIMEOUT,
} from "../../config";

import { logger } from "../../util/logger";
import { configuredCounterMetric, technicalAgeMetric } from "../../util/metrics";

export interface ConsentCookie {
  consent: boolean;
}

export const getTemplateValues = (req: Request, type: string = "3rd-party") => {
  let cookie: ConsentCookie | undefined;
  if (req.cookies[COOKIE_NAME]) {
    try {
      cookie = JSON.parse(Buffer.from(req.cookies[COOKIE_NAME], "base64").toString());
    } catch (e) {
      logger.info(`Error parsing cookie ${COOKIE_NAME}`, e);
    }
  }
  logger.debug(`hasCookie=${cookie !== undefined}; hasConsent=${cookie?.consent}`);

  let cookieAdditionalChannels: ConsentCookie | undefined;
  if (req.cookies[COOKIE_NAME_ADDITIONAL_CHANNELS]) {
    try {
      cookieAdditionalChannels = JSON.parse(
        Buffer.from(req.cookies[COOKIE_NAME_ADDITIONAL_CHANNELS], "base64").toString(),
      );
    } catch (e) {
      logger.info(`Error parsing cookie ${COOKIE_NAME_ADDITIONAL_CHANNELS}`, e);
    }
  }
  logger.debug(
    `hasCookieAdditionalChannels=${cookieAdditionalChannels !== undefined}; hasConsentAdditionalChannels=${
      cookieAdditionalChannels?.consent
    }`,
  );

  let tcConsent: boolean | undefined;
  if (cookie) {
    tcConsent = cookie?.consent ?? false;
  }
  if (req.query.consent) {
    // consent from url param comes from localStorage on device and takes preference over cookie
    logger.debug(`consent in url param found ${req.query.consent}`);
    if (req.query.consent === "false") tcConsent = false;
    if (req.query.consent === "true") tcConsent = true;
  }

  let tcConsentAdditionalChannels: boolean | undefined;
  if (cookieAdditionalChannels) {
    tcConsent = cookieAdditionalChannels?.consent ?? false;
  }
  if (req.query.consentAdditionalChannels) {
    // consent from url param comes from localStorage on device and takes preference over cookie
    logger.debug(`consent in url param found ${req.query.consentAdditionalChannels}`);
    if (req.query.consentAdditionalChannels === "false") tcConsentAdditionalChannels = false;
    if (req.query.consentAdditionalChannels === "true") tcConsentAdditionalChannels = true;
  }

  let cmpStatus: "loaded" | "disabled" = "disabled";

  configuredCounterMetric
    .labels({ type, channel: req.channelName, consent: tcConsent === undefined ? "undefined" : tcConsent.toString() })
    .inc();
  technicalAgeMetric.labels({ type, channel: req.channelName }).observe(Date.now() - req.timestamp);

  const technicalCookiePassed = CMP_ENABLED && req.timestamp && Date.now() - req.timestamp >= TECH_COOKIE_MIN;

  if (technicalCookiePassed || tcConsent !== undefined || tcConsentAdditionalChannels !== undefined) {
    // if the tech cookie is set and is old enough, the cmp is enabled
    cmpStatus = "loaded";
  }

  if (
    cmpStatus === "loaded" &&
    tcConsent === undefined &&
    tcConsentAdditionalChannels === undefined &&
    Math.floor(Math.random() * 100 + 1) > CMP_ENABLED_SAMPLING_THRESHOLD_PERCENT
  ) {
    // request randomly chosen to be outside the configured sampling threshold,
    // so disable consent status
    cmpStatus = "disabled";
  }

  if (cmpStatus === "loaded") logger.debug("enable consent status for this request");

  return {
    API_VERSION,
    COOKIE_NAME,
    COOKIE_NAME_ADDITIONAL_CHANNELS,
    TC_STRING: "tcstr",
    CMP_STATUS: cmpStatus,
    TC_CONSENT: tcConsent ?? "undefined",
    TC_CONSENT_ADDITIONAL_CHANNELS: tcConsentAdditionalChannels ?? "undefined",
    CONSENT_SERVER_HOST: HTTP_HOST,
    CONSENT_SERVER_PROTOCOL: req.protocol,
    CHANNEL_ID: req.query.channelId ? req.query.channelId.toString() : "",
    BANNER_TIMEOUT,
  };
};
