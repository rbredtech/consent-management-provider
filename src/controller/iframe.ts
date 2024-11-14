import { Request, Response } from "express";

import { API_VERSION, HTTP_HOST, BUILD_NUMBER, FORCE_ERROR } from "../config";

export const iframeController = (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html");
  res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=300, stale-while-revalidate");

  if (FORCE_ERROR) {
    res.sendStatus(500);
    return;
  }

  res.render("iframe.html", {
    VERSION_PATH: API_VERSION ? `/${API_VERSION}/` : "/",
    CONSENT_SERVER_HOST: HTTP_HOST,
    CHANNEL_ID: req.channelId,
    BUILD_NUMBER,
  });
};
