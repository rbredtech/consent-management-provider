import { Request, Response } from "express";

import {
  API_VERSION, BUILD_NUMBER,
  CMP_DISABLED_CHANNEL_IDS,
  CMP_ENABLED,
  CMP_ENABLED_SAMPLING_THRESHOLD_PERCENT,
  CONSENT_COOKIE_NAME,
  COOKIE_DOMAIN,
  HTTP_HOST,
  TECH_COOKIE_MIN,
  TECH_COOKIE_NAME,
} from "../config";
import { logger } from "../util/logger";

export const iframeController = (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html");
  res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600, stale-while-revalidate");

  const channelId = req.query.channelId?.toString();
  const disabledChannelIds = CMP_DISABLED_CHANNEL_IDS?.split(",").map((channelId) => channelId.trim());
  const cmpDisabledByChannelId = channelId && disabledChannelIds ? disabledChannelIds?.includes(channelId) : false;
  const cmpEnabled = CMP_ENABLED && !cmpDisabledByChannelId;

  try {
    res.render("iframe.html", {
      CONSENT_SERVER_HOST: HTTP_HOST,
      BUILD_NUMBER,
      VERSION_PATH: API_VERSION ? `/${API_VERSION}/` : "/",
      CONSENT_COOKIE_NAME,
      COOKIE_DOMAIN,
      CMP_ENABLED: cmpEnabled,
      TECH_COOKIE_MIN,
      TECH_COOKIE_NAME,
      CMP_ENABLED_SAMPLING_THRESHOLD_PERCENT,
      CHANNEL_ID: channelId ?? "",
    });
  } catch (e) {
    logger.error(e);
    res.status(500).send(e);
  }
};
