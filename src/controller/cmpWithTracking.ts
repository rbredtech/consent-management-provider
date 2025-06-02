import { renderFile } from "ejs";
import { Request, Response } from "express";
import path from "path";

import { API_VERSION, CONSENT_COOKIE_NAME, HTTP_HOST, TECH_COOKIE_NAME, TRACKING_HOST_CONSENT, TRACKING_HOST_NO_CONSENT, TRACKING_VERSION } from "../config";

export const cmpWithTrackingController = async (req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/javascript");

  if (!req.query.channelId) {
    res.status(400).send({ error: "query parameter channelId is mandatory" });
    return;
  }

  if (!req.query.cmpId) {
    res.status(400).send({ error: "query parameter cmpId is mandatory" });
    return;
  }

  try {
    const cmpWithTrackingJs = (
      await renderFile(path.join(__dirname, "../templates/cmpWithTracking.js"), {
        VERSION_PATH: API_VERSION ? `/${API_VERSION}/` : "/",
        CONSENT_SERVER_HOST: HTTP_HOST,
        CHANNEL_ID: req.query.channelId,
        CMP_ID: req.query.cmpId,
        TRACKING_HOST_CONSENT,
        TRACKING_HOST_NO_CONSENT,
        TRACKING_RESOLUTION: req.query.r,
        TRACKING_DELIVERY: req.query.d,
        TRACKING_SUSPENDED: req.query.suspended,
        TRACKING_CONTEXT_ID: req.query.i,
        TRACKING_VERSION_PATH: TRACKING_VERSION ? `/${TRACKING_VERSION}/` : "/",
      })
    )
      .replaceAll("{{CONSENT_COOKIE_CONTENT}}", req.cookies[CONSENT_COOKIE_NAME] ?? "")
      .replaceAll("{{TECH_COOKIE_VALUE}}", req.cookies[TECH_COOKIE_NAME] ?? "");
    res.send(cmpWithTrackingJs);
  } catch (e) {
    res.status(500).send(e);
  }
};
