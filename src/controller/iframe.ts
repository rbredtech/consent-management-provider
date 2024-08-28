import { Request, Response } from "express";

import { API_VERSION, CONSENT_COOKIE_NAME, LEGACY_COOKIE_NAME, HTTP_HOST, TECH_COOKIE_NAME } from "../config";

export const iframeController = (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html");
  res.setHeader("Cache-Control", "no-store");

  res.render("iframe.html", {
    TECH_COOKIE_TIMESTAMP: req.timestamp,
    TECH_COOKIE_NAME,
    LEGACY_COOKIE_NAME,
    CONSENT_COOKIE_NAME,
    API_VERSION,
    CONSENT_SERVER_HOST: HTTP_HOST,
    CHANNEL_ID: req.channelId,
  });
};
