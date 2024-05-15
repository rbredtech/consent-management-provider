import { Request } from "express";

import {
  API_VERSION,
  BANNER_TIMEOUT,
  CMP_ENABLED,
  CMP_ENABLED_SAMPLING_THRESHOLD_PERCENT,
  CONSENT_COOKIE_NAME,
  COOKIE_NAME,
  TECH_COOKIE_MIN,
  HTTP_HOST,
} from "../../config";

import { logger } from "../../util/logger";
import { configuredCounterMetric, technicalAgeMetric } from "../../util/metrics";

export interface ConsentCookie {
  consent: boolean;
}

export interface ConsentVendorIdsCookie {
  consent: string;
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

  let cookieConsentVendorIds: ConsentVendorIdsCookie | undefined;
  if (req.cookies[CONSENT_COOKIE_NAME]) {
    try {
      cookieConsentVendorIds = JSON.parse(Buffer.from(req.cookies[CONSENT_COOKIE_NAME], "base64").toString());
    } catch (e) {
      logger.info(`Error parsing cookie ${CONSENT_COOKIE_NAME}`, e);
    }
    logger.debug(
      `hasCookieConsentVendorIds=${cookieConsentVendorIds !== undefined}; consentVendorIds=${cookieConsentVendorIds}`,
    );
  }

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

  let tcConsentVendorIds: string | undefined;
  if (cookieConsentVendorIds) {
    tcConsentVendorIds = cookieConsentVendorIds.consent || undefined;
  }
  if (req.query.vendorConsents) {
    // consent from url param comes from localStorage on device and takes preference over cookie
    logger.debug(`consent in url param found ${req.query.vendorConsents.toString()}`);
    tcConsentVendorIds = req.query.vendorConsents.toString();
  }

  let cmpStatus: "loaded" | "disabled" = "disabled";

  configuredCounterMetric
    .labels({ type, channel: req.channelName, consent: tcConsent === undefined ? "undefined" : tcConsent.toString() })
    .inc();
  technicalAgeMetric.labels({ type, channel: req.channelName }).observe(Date.now() - req.timestamp);

  const technicalCookiePassed = CMP_ENABLED && req.timestamp && Date.now() - req.timestamp >= TECH_COOKIE_MIN;

  if (technicalCookiePassed || tcConsent !== undefined || tcConsentVendorIds !== undefined) {
    // if the tech cookie is set and is old enough, the cmp is enabled
    cmpStatus = "loaded";
  }

  if (
    cmpStatus === "loaded" &&
    tcConsent === undefined &&
    tcConsentVendorIds === undefined &&
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
    CONSENT_COOKIE_NAME,
    TC_STRING: "tcstr",
    CMP_STATUS: cmpStatus,
    TC_CONSENT: tcConsent ?? "undefined",
    TC_CONSENT_VENDER_IDS: tcConsentVendorIds || "",
    CONSENT_SERVER_HOST: HTTP_HOST,
    CONSENT_SERVER_PROTOCOL: req.protocol,
    CHANNEL_ID: req.query.channelId ? req.query.channelId.toString() : "",
    BANNER_TIMEOUT,
  };
};
