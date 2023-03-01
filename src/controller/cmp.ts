import { Request, Response } from "express";

import {
  API_VERSION,
  HTTP_HOST,
  TECH_COOKIE_NAME,
  COOKIE_NAME,
  TRACKING_PROTOCOL,
  TRACKING_HOST_CONSENT,
  TRACKING_HOST_NO_CONSENT,
  TRACKING_VERSION,
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
      COOKIE_NAME,
      API_VERSION,
      CONSENT_SERVER_HOST: HTTP_HOST,
      CONSENT_SERVER_PROTOCOL: req.protocol,
      CHANNEL_ID: req.channelId,
      TRACKING_PROTOCOL,
      TRACKING_HOST_CONSENT,
      TRACKING_HOST_NO_CONSENT,
      TRACKING_VERSION,
    });
  } catch (e) {
    res.status(500).send(e);
  }
};
