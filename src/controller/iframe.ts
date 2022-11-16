import { Request, Response } from "express";

import { HTTP_HOST } from "../config";

export const iframeController = (req: Request, res: Response) => {
  const channelId = Number(req.query.channelId);

  if (req.query.channelId && isNaN(channelId)) {
    res
      .status(500)
      .send({ error: "query parameter channelId must be numeric" });
    return;
  }

  res.setHeader("Content-Type", "text/html");
  res.setHeader("Cache-Control", "no-store");
  res.render("iframe", {
    XT: Date.now(),
    CONSENT_SERVER_HOST: HTTP_HOST,
    URL_SCHEME: req.protocol,
    BANNER: req.withBanner ? "-with-banner" : "",
    CHANNEL_ID: req.query.channelId ? channelId : "",
  });
};
