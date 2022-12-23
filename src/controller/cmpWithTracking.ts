import { renderFile } from "ejs";
import { Request, Response } from "express";
import path from "path";

import {
  API_VERSION,
  COOKIE_NAME,
  HTTP_HOST,
  TECH_COOKIE_NAME,
  TRACKING_HOST_CONSENT,
  TRACKING_HOST_NO_CONSENT,
  TRACKING_PROTOCOL,
} from "../config";

export const cmpWithTrackingController = async (req: Request, res: Response) => {
  const channelId = Number(req.channelId);

  if (req.channelId && isNaN(channelId)) {
    res.status(400).send({ error: "query parameter channelId must be numeric" });
    return;
  }

  if (!req.query.cmpId) {
    res.status(400).send({ error: "query parameter cmpId is mandatory" });
  }

  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("Cache-Control", "no-store");

  try {
    const cmpJs = await renderFile(path.join(__dirname, "../templates/cmp.js"), {
      XT: Date.now(),
      TECH_COOKIE_NAME,
      COOKIE_NAME,
      API_VERSION,
      CONSENT_SERVER_HOST: HTTP_HOST,
      URL_SCHEME: req.protocol,
      CHANNEL_ID: req.channelId,
    });
    const trackingJs = await renderFile(path.join(__dirname, "../templates/cmpWithTracking.js"), {
      CHANNEL_ID: req.channelId,
      CMP_ID: req.query.cmpId,
      TRACKING_PROTOCOL,
      TRACKING_HOST_CONSENT,
      TRACKING_HOST_NO_CONSENT,
      TRACKING_RESOLUTION: req.query.r,
      TRACKING_DELIVERY: req.query.d,
      TRACKING_TIMESTAMP: req.query.t || Math.round(Date.now() / 1000),
      TRACKING_SUSPENDED: req.query.suspended,
      TRACKING_CONTEXT_ID: req.query.i,
    });

    res.send(`${cmpJs}${trackingJs}`);
  } catch (e) {
    res.status(500).send(e);
  }
};
