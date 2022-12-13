import { Request, Response } from "express";

import { COOKIE_DOMAIN, COOKIE_NAME } from "../config";
import { consentCounterMetric } from "../util/metrics";

export const removeConsentController = (req: Request, res: Response) => {
  consentCounterMetric.labels({ consent: "remove" }).inc();

  res.cookie(COOKIE_NAME, "{}", {
    maxAge: 0,
    domain: COOKIE_DOMAIN,
  });
  res.setHeader("Cache-Control", "no-store");
  res.sendStatus(200);
};
