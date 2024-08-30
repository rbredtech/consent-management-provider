import { Request, Response } from "express";

import { API_VERSION, HTTP_HOST } from "../config";

export const iframeController = (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html");
  res.setHeader("Cache-Control", "no-store");

  res.render("iframe.html", {
    API_VERSION,
    CONSENT_SERVER_HOST: HTTP_HOST,
    CHANNEL_ID: req.channelId,
  });
};
