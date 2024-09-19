import { Request, Response } from "express";

import { logger } from "../util/logger";

import {
  API_VERSION,
  LEGACY_COOKIE_NAME,
  CONSENT_COOKIE_NAME,
  COOKIE_DOMAIN,
  CMP_ENABLED,
  TECH_COOKIE_MIN,
  TECH_COOKIE_NAME,
  CMP_ENABLED_SAMPLING_THRESHOLD_PERCENT,
  HTTP_HOST,
} from "../config";

export const cmpapiController = async (req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("Cache-Control", "public, max-age=3600");

  try {
    res.render("cmpapi.js", {
      API_VERSION,
      LEGACY_COOKIE_NAME,
      CONSENT_COOKIE_NAME,
      COOKIE_DOMAIN,
      CMP_ENABLED,
      TECH_COOKIE_MIN,
      TECH_COOKIE_NAME,
      CMP_ENABLED_SAMPLING_THRESHOLD_PERCENT,
      CONSENT_SERVER_HOST: HTTP_HOST,
      CHANNEL_ID: req.query.channelId ? req.query.channelId.toString() : "",
    });
  } catch (e) {
    logger.error(e);
    res.status(500).send(e);
  }
};
