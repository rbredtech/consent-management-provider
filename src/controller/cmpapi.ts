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
  CMP_DISABLED_CHANNEL_IDS,
} from "../config";

export const cmpapiController = async (req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("Cache-Control", "public, max-age=3600");

  const channelId = req.query.channelId?.toString();
  const disabledChannelIds = CMP_DISABLED_CHANNEL_IDS?.split(",").map((channelId) => channelId.trim());
  const cmpDisabledByChannelId = channelId && disabledChannelIds ? disabledChannelIds?.includes(channelId) : false;
  const cmpEnabled = CMP_ENABLED && !cmpDisabledByChannelId;

  try {
    res.render("cmpapi.js", {
      VERSION_PATH: API_VERSION ? `/${API_VERSION}/` : "/",
      LEGACY_COOKIE_NAME,
      CONSENT_COOKIE_NAME,
      COOKIE_DOMAIN,
      CMP_ENABLED: cmpEnabled,
      TECH_COOKIE_MIN,
      TECH_COOKIE_NAME,
      CMP_ENABLED_SAMPLING_THRESHOLD_PERCENT,
      CONSENT_SERVER_HOST: HTTP_HOST,
      CHANNEL_ID: channelId ?? "",
    });
  } catch (e) {
    logger.error(e);
    res.status(500).send(e);
  }
};
