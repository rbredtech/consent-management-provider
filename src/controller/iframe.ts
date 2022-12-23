import { Request, Response } from "express";

import { API_VERSION, HTTP_HOST, TECH_COOKIE_NAME, COOKIE_NAME } from "../config";

export const iframeController = (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html");
  res.setHeader("Cache-Control", "no-store");

  res.render("iframe.html", {
    XT: req.timestamp,
    TECH_COOKIE_NAME,
    COOKIE_NAME,
    API_VERSION,
    CONSENT_SERVER_HOST: HTTP_HOST,
    URL_SCHEME: req.protocol,
    CHANNEL_ID: req.channelId,
  });
};
