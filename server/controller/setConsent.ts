import { Request, Response } from "express";

const { CONSENT_COOKIE_NAME, COOKIE_DOMAIN } = process.env;

const img = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNiYAAAAAkAAxkR2eQAAAAASUVORK5CYII=", "base64");

export const setConsentController = (req: Request, res: Response) => {
  if (!req.query.c) {
    res.status(400).send("No consent decision submitted");
    return;
  }

  try {
    Buffer.from(req.query.c.toString(), "base64").toString();
  } catch (e) {
    res.status(400).send("Invalid consent decision submitted");
    return;
  }

  res.cookie(String(CONSENT_COOKIE_NAME), req.query.q, {
    maxAge: 63072000,
    domain: COOKIE_DOMAIN,
  });

  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "image/png");
  res.setHeader("Content-Length", img.length);
  res.send(img);
};
