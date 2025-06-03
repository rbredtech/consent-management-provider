import { Request, Response } from "express";

const { CONSENT_COOKIE_NAME, COOKIE_DOMAIN } = process.env;

const img = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNiYAAAAAkAAxkR2eQAAAAASUVORK5CYII=", "base64");

export const removeConsentController = (_req: Request, res: Response) => {
  res.cookie(String(CONSENT_COOKIE_NAME), "{}", {
    maxAge: 0,
    domain: COOKIE_DOMAIN,
  });

  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "image/png");
  res.setHeader("Content-Length", img.length);
  res.send(img);
};
