import { Request, Response } from "express";

import {
  API_VERSION,
  HTTP_HOST,
  TECH_COOKIE_NAME,
  LEGACY_COOKIE_NAME,
  CONSENT_COOKIE_NAME,
  SUBMIT_CONSENT_FOR_TRACKING_DEVICE_ID_URL,
} from "../config";
import { loadedCounterMetric } from "../util/metrics";

export const cmpController = async (req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("Cache-Control", "no-store");

  loadedCounterMetric.labels({ channel: req.channelName }).inc();

  try {
    res.render("cmp.js", {
      TECH_COOKIE_TIMESTAMP: Date.now(),
      TECH_COOKIE_NAME,
      LEGACY_COOKIE_NAME,
      CONSENT_COOKIE_NAME,
      API_VERSION,
      CONSENT_SERVER_HOST: HTTP_HOST,
      CHANNEL_ID: req.channelId,
      SUBMIT_CONSENT_FOR_TRACKING_DEVICE_ID_URL,
    });
  } catch (e) {
    res.status(500).send(e);
  }
};
