import { Request, Response } from "express";

import { API_VERSION, HTTP_HOST, TRACKING_HOST_CONSENT, TRACKING_HOST_NO_CONSENT, TRACKING_VERSION } from "../config";

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
  res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600, stale-while-revalidate");

  try {
    res.render("cmpWithTracking.js", {
      VERSION_PATH: API_VERSION ? `/${API_VERSION}/` : "/",
      CONSENT_SERVER_HOST: HTTP_HOST,
      CHANNEL_ID: req.channelId,
      CMP_ID: req.query.cmpId,
      TRACKING_HOST_CONSENT,
      TRACKING_HOST_NO_CONSENT,
      TRACKING_RESOLUTION: req.query.r,
      TRACKING_DELIVERY: req.query.d,
      TRACKING_SUSPENDED: req.query.suspended,
      TRACKING_CONTEXT_ID: req.query.i,
      TRACKING_VERSION_PATH: TRACKING_VERSION ? `/${TRACKING_VERSION}/` : "/",
    });
  } catch (e) {
    res.status(500).send(e);
  }
};
