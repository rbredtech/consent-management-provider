import { renderFile } from "ejs";
import { Request, Response } from "express";
import path from "path";

import { logger } from "../util/logger";

import {
  API_VERSION,
  CMP_DISABLED_CHANNEL_IDS,
  CMP_ENABLED,
  CMP_ENABLED_SAMPLING_THRESHOLD_PERCENT,
  CONSENT_COOKIE_NAME,
  COOKIE_DOMAIN,
  HTTP_HOST,
  TECH_COOKIE_MIN,
  TECH_COOKIE_NAME,
} from "../config";

export const cmpapiController = async (req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/javascript");

  const channelId = req.query.channelId?.toString();
  const disabledChannelIds = CMP_DISABLED_CHANNEL_IDS?.split(",").map((channelId) => channelId.trim());
  const cmpDisabledByChannelId = channelId && disabledChannelIds ? disabledChannelIds?.includes(channelId) : false;
  const cmpEnabled = CMP_ENABLED && !cmpDisabledByChannelId;

  try {
    const cmpapiJs = (
      await renderFile(path.join(__dirname, "../templates/cmp.js"), {
        VERSION_PATH: API_VERSION ? `/${API_VERSION}/` : "/",
        CONSENT_COOKIE_NAME,
        COOKIE_DOMAIN,
        CMP_ENABLED: cmpEnabled,
        TECH_COOKIE_MIN,
        TECH_COOKIE_NAME,
        CMP_ENABLED_SAMPLING_THRESHOLD_PERCENT,
        CONSENT_SERVER_HOST: HTTP_HOST,
        CHANNEL_ID: channelId ?? "",
      })
    )
      .replaceAll("{{CONSENT_COOKIE_CONTENT}}", req.cookies[CONSENT_COOKIE_NAME] ?? "")
      .replaceAll("{{TECH_COOKIE_VALUE}}", req.cookies[TECH_COOKIE_NAME] ?? "");
    res.send(cmpapiJs);
  } catch (e) {
    logger.error(e);
    res.status(500).send(e);
  }
};
