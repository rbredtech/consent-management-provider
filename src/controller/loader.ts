import ejs from "ejs";
import { Request, Response } from "express";
import path from "path";

import { API_VERSION, HTTP_HOST, TECH_COOKIE_NAME } from "../config";
import { loadedCounterMetric } from "../util/metrics";

export const loaderController = async (req: Request, res: Response) => {
  const channelId = Number(req.query.channelId);

  if (req.query.channelId && isNaN(channelId)) {
    res
      .status(500)
      .send({ error: "query parameter channelId must be numeric" });
    return;
  }

  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("Cache-Control", "no-store");

  loadedCounterMetric.inc();

  try {
    const loaderJs = await ejs.renderFile(
      path.join(__dirname, "../../templates/loader.ejs"),
      {
        XT: Date.now(),
        TECH_COOKIE_NAME,
        API_VERSION,
        CONSENT_SERVER_HOST: HTTP_HOST,
        URL_SCHEME: req.protocol,
        BANNER: req.withBanner ? "-with-banner" : "",
        CHANNEL_ID: req.query.channelId ? channelId : "",
      }
    );

    res.send(loaderJs);
  } catch (e) {
    res.status(500).send(e);
  }
};
