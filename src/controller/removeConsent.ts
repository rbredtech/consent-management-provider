import { Request, Response } from "express";

import { COOKIE_DOMAIN, COOKIE_NAME, COOKIE_NAME_ADDITIONAL_CHANNELS } from "../config";
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
  res.cookie(COOKIE_NAME_ADDITIONAL_CHANNELS, "{}", {
    maxAge: 0,
    domain: COOKIE_DOMAIN,
  });

  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "image/png");
  res.setHeader("Content-Length", img.length);
  res.send(img);
};
