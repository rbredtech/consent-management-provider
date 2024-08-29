import { Request, Response } from "express";

import { LEGACY_COOKIE_NAME, COOKIE_MAXAGE, CONSENT_COOKIE_NAME } from "../config";
import { consentCounterMetric } from "../util/metrics";
import { ConsentCookie } from "./util/getTemplateValues";

const img = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNiYAAAAAkAAxkR2eQAAAAASUVORK5CYII=",
  "base64",
);

export const resetOldConsentController = (req: Request, res: Response) => {
  const cookie: ConsentCookie = {
    consent: req.query?.consent === "1",
  };

  consentCounterMetric
    .labels({
      consent: cookie.consent.toString(),
      channel: req.channelName,
    })
    .inc();

  res.cookie(LEGACY_COOKIE_NAME, Buffer.from(JSON.stringify(cookie)).toString("base64"), {
    maxAge: COOKIE_MAXAGE,
  });

  res.cookie(CONSENT_COOKIE_NAME, "{}", {
    maxAge: 0,
  });

  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "image/png");
  res.setHeader("Content-Length", img.length);
  res.send(img);
};
