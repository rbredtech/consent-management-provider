import { Request, Response } from "express";

import { API_VERSION, HTTP_HOST, TECH_COOKIE_NAME, COOKIE_NAME } from "../config";
import { loadedCounterMetric } from "../util/metrics";

export const loaderController = async (req: Request, res: Response) => {
  const channelId = Number(req.query.channelId);

  if (req.query.channelId && isNaN(channelId)) {
    res.status(500).send({ error: "query parameter channelId must be numeric" });
    return;
  }

  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("Cache-Control", "no-store");

  loadedCounterMetric.labels({ channel: req.channelName }).inc();

  try {
    res.render("loader.js", {
      XT: Date.now(),
      TECH_COOKIE_NAME,
      COOKIE_NAME,
      API_VERSION,
      CONSENT_SERVER_HOST: HTTP_HOST,
      URL_SCHEME: req.protocol,
      CHANNEL_ID: req.channelId,
    });
  } catch (e) {
    res.status(500).send(e);
  }
};
