import { Request, Response } from "express";

import { COOKIE_DOMAIN, COOKIE_MAXAGE, CONSENT_COOKIE_NAME } from "../config";
import { consentCounterMetric } from "../util/metrics";
import { ConsentByVendorIdCookie } from "./util/getTemplateValues";
import { logger } from "../util/logger";

const img = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNiYAAAAAkAAxkR2eQAAAAASUVORK5CYII=",
  "base64",
);

const parseSerializedConsentByVendorId = (serialized: string): Record<number, boolean | undefined> => {
  const parsed: Record<number, boolean | undefined> = {};

  if (serialized) {
    serialized.split(",").forEach((consentEntry: string) => {
      const split = consentEntry.split("~");
      parsed[Number(split[0])] = split[1] === "undefined" ? undefined : split[1] === "true";
    });
  }

  return parsed;
};

const serializeConsentByVendorId = (consent: Record<number, boolean | undefined>): string => {
  let serializedEntries: string[] = [];
  Object.entries(consent).forEach(([vendorId, consent]) => {
    if (consent !== undefined) {
      serializedEntries.push(`${vendorId}~${consent}`);
    }
  });
  return serializedEntries.join(",");
};

export const setConsentController = (req: Request, res: Response) => {
  let currentConsentByVendorId: Record<number, boolean | undefined> = {};

  if (req.cookies[CONSENT_COOKIE_NAME]) {
    try {
      const parsedCookie = JSON.parse(Buffer.from(req.cookies[CONSENT_COOKIE_NAME], "base64").toString());
      currentConsentByVendorId = parseSerializedConsentByVendorId(parsedCookie.consent);
    } catch (e) {
      logger.info(`Error parsing cookie ${CONSENT_COOKIE_NAME}`, e);
    }
  }

  let consentUpdateByVendorId: Record<number, boolean | undefined> = {};
  const consentUpdate = req.query?.consentByVendorId?.toString();
  if (consentUpdate) {
    try {
      consentUpdateByVendorId = parseSerializedConsentByVendorId(consentUpdate);
    } catch (e) {
      logger.info(`Error parsing consentByVendorId param`, e);
    }
  }

  const serializedUpdatedConsentByVendorId = serializeConsentByVendorId({
    ...currentConsentByVendorId,
    ...consentUpdateByVendorId,
  });

  const consentByVendorIdCookie: ConsentByVendorIdCookie = {
    consent: serializedUpdatedConsentByVendorId,
  };

  consentCounterMetric
    .labels({
      consent: consentByVendorIdCookie.consent,
      channel: req.channelName,
    })
    .inc();

  res.cookie(CONSENT_COOKIE_NAME, Buffer.from(JSON.stringify(consentByVendorIdCookie)).toString("base64"), {
    maxAge: COOKIE_MAXAGE,
    domain: COOKIE_DOMAIN,
  });

  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "image/png");
  res.setHeader("Content-Length", img.length);
  res.send(img);
};
