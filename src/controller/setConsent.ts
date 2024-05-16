import { Request, Response } from "express";

import { COOKIE_DOMAIN, COOKIE_NAME, COOKIE_MAXAGE, CONSENT_COOKIE_NAME } from "../config";
import { consentCounterMetric } from "../util/metrics";
import { ConsentCookie, ConsentByVendorIdCookie } from "./util/getTemplateValues";

const img = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNiYAAAAAkAAxkR2eQAAAAASUVORK5CYII=",
  "base64",
);

export const setConsentController = (req: Request, res: Response) => {
  const cookie: ConsentCookie = {
    consent: req.query?.consent === "1",
  };

  const consentByVendorIdCookie: ConsentByVendorIdCookie = {
    consent: req.query?.consentByVendorId?.toString() ?? "",
  };

  consentCounterMetric
    .labels({
      consent: consentByVendorIdCookie.consent,
      channel: req.channelName,
    })
    .inc();

  res.cookie(COOKIE_NAME, Buffer.from(JSON.stringify(cookie)).toString("base64"), {
    maxAge: COOKIE_MAXAGE,
    domain: COOKIE_DOMAIN,
  });

  res.cookie(CONSENT_COOKIE_NAME, Buffer.from(JSON.stringify(consentByVendorIdCookie)).toString("base64"), {
    maxAge: COOKIE_MAXAGE,
    domain: COOKIE_DOMAIN,
  });

  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "image/png");
  res.setHeader("Content-Length", img.length);
  res.send(img);
};
