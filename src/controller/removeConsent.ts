import { Request, Response } from "express";

import { CONSENT_COOKIE_NAME, COOKIE_DOMAIN, COOKIE_NAME } from "../config";
import { consentCounterMetric } from "../util/metrics";

const img = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNiYAAAAAkAAxkR2eQAAAAASUVORK5CYII=",
  "base64",
);

export const removeConsentController = (req: Request, res: Response) => {
  consentCounterMetric.labels({ consent: "remove" }).inc();

  res.cookie(COOKIE_NAME, "{}", {
    maxAge: 0,
    domain: COOKIE_DOMAIN,
  });
  res.cookie(CONSENT_COOKIE_NAME, "{}", {
    maxAge: 0,
    domain: COOKIE_DOMAIN,
  });

  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "image/png");
  res.setHeader("Content-Length", img.length);
  res.send(img);
};
