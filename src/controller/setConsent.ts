import { Request, Response } from "express";

import { COOKIE_DOMAIN, COOKIE_NAME, COOKIE_MAXAGE } from "../config";
import { consentCounterMetric } from "../util/metrics";

export const setConsentController = (req: Request, res: Response) => {
  const channelId = Number(req.query.channelId);

  if (req.query.channelId && isNaN(channelId)) {
    res
      .status(500)
      .send({ error: "query parameter channelId must be numeric" });
    return;
  }

  const cookie: ConsentCookie = {
    consent: req.query?.consent === "1",
  };

  consentCounterMetric
    .labels({
      consent: cookie.consent.toString(),
      channel: req.channelName,
    })
    .inc();

  res.cookie(
    COOKIE_NAME,
    Buffer.from(JSON.stringify(cookie)).toString("base64"),
    {
      maxAge: COOKIE_MAXAGE,
      domain: COOKIE_DOMAIN,
    }
  );
  res.setHeader("Cache-Control", "no-store");
  res.sendStatus(200);
};
