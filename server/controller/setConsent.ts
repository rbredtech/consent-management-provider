import { Request, Response } from "express";

import { CONSENT_COOKIE_NAME, COOKIE_DOMAIN, COOKIE_MAXAGE } from "../config.js";

const img = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNiYAAAAAkAAxkR2eQAAAAASUVORK5CYII=", "base64");

export const setConsentController = (req: Request, res: Response) => {
  if (!req.query.q) {
    res.status(400).send("No consent decision submitted");
    return;
  }

  try {
    Buffer.from(req.query.q.toString(), "base64").toString();
  } catch (e) {
    res.status(400).send("Invalid consent decision submitted");
    return;
  }

  res.cookie(CONSENT_COOKIE_NAME, req.query.q, {
    maxAge: Number(COOKIE_MAXAGE),
    domain: COOKIE_DOMAIN,
  });

  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "image/png");
  res.setHeader("Content-Length", img.length);
  res.send(img);
};
