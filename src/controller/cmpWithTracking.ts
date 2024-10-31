import { renderFile } from "ejs";
import { Request, Response } from "express";
import path from "path";

import { API_VERSION, HTTP_HOST, TRACKING_HOST_CONSENT, TRACKING_HOST_NO_CONSENT } from "../config";

export const cmpWithTrackingController = async (req: Request, res: Response) => {
  if (req.channelId === undefined) {
    res.status(400).send({ error: "query parameter channelId is mandatory" });
    return;
  }

  if (req.query.cmpId === undefined) {
    res.status(400).send({ error: "query parameter cmpId is mandatory" });
    return;
  }

  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("Cache-Control", "public, max-age=3600");

  try {
    const cmpJs = await renderFile(path.join(__dirname, "../templates/cmp.js"), {
      VERSION_PATH: API_VERSION ? `/${API_VERSION}/` : "/",
      CONSENT_SERVER_HOST: HTTP_HOST,
      CHANNEL_ID: req.channelId,
    });
    const trackingJs = await renderFile(path.join(__dirname, "../templates/cmpWithTracking.js"), {
      CHANNEL_ID: req.channelId,
      CMP_ID: req.query.cmpId,
      TRACKING_HOST_CONSENT,
      TRACKING_HOST_NO_CONSENT,
      TRACKING_RESOLUTION: req.query.r,
      TRACKING_DELIVERY: req.query.d,
      TRACKING_TIMESTAMP: req.query.t || Math.round(Date.now() / 1000),
      TRACKING_SUSPENDED: req.query.suspended,
      TRACKING_CONTEXT_ID: req.query.i,
      VERSION_PATH: API_VERSION ? `/${API_VERSION}/` : "/",
    });

    res.send(`${cmpJs}${trackingJs}`);
  } catch (e) {
    res.status(500).send(e);
  }
};
