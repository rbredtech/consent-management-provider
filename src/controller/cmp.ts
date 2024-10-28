import { Request, Response } from "express";

import { API_VERSION, HTTP_HOST, SUBMIT_CONSENT_FOR_TRACKING_DEVICE_ID_URL } from "../config";
import { loadedCounterMetric } from "../util/metrics";

export const cmpController = async (req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("Cache-Control", "public, max-age=3600");

  loadedCounterMetric.labels({ channel: req.channelName }).inc();

  try {
    res.render("cmp.js", {
      API_VERSION,
      VERSION_PATH: API_VERSION ? `/${API_VERSION}/` : "/",
      CONSENT_SERVER_HOST: HTTP_HOST,
      CHANNEL_ID: req.channelId,
      SUBMIT_CONSENT_FOR_TRACKING_DEVICE_ID_URL,
    });
  } catch (e) {
    res.status(500).send(e);
  }
};
