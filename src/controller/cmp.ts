import { Request, Response } from "express";

import { API_VERSION, HTTP_HOST, BUILD_NUMBER, FORCE_ERROR } from "../config";
import { loadedCounterMetric } from "../util/metrics";

export const cmpController = async (req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate");

  if (FORCE_ERROR) {
    res.sendStatus(500);
    return;
  }

  loadedCounterMetric.labels({ channel: req.channelName }).inc();

  try {
    res.render("cmp.js", {
      VERSION_PATH: API_VERSION ? `/${API_VERSION}/` : "/",
      CONSENT_SERVER_HOST: HTTP_HOST,
      CHANNEL_ID: req.channelId,
      BUILD_NUMBER,
    });
  } catch (e) {
    res.status(500).send(e);
  }
};
