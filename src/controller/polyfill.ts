import { Request, Response } from "express";
import path from "path";

export const polyfillController = async (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600, stale-while-revalidate");

  try {
    res.sendFile(path.join(__dirname, "..", "templates", "polyfill.js"));
  } catch (e) {
    res.status(500).send(e);
  }
};
