import ejs from "ejs";
import { Request, Response } from "express";
import path from "path";

import { HTTP_HOST } from "../config";
import { minify } from "../util/minify";
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
      path.join(__dirname, "../templates/loader.ejs"),
      {
        XT: Date.now(),
        CONSENT_SERVER_HOST: HTTP_HOST,
        URL_SCHEME: req.protocol,
        BANNER: req.withBanner ? "-with-banner" : "",
        CHANNEL_ID: req.query.channelId ? channelId : "",
      }
    );

    const loaderJsMinified = minify(loaderJs);
    if (loaderJsMinified.error) {
      res.status(500).send(loaderJsMinified.error);
      return;
    }

    res.send(loaderJsMinified.code);
  } catch (e) {
    res.status(500).send(e);
  }
};
