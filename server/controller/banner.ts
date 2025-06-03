import { Request, Response } from "express";

import { BANNER_TIMEOUT } from "../config.js";

export const bannerController = async (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/javascript");

  try {
    res.render("banner.js", {
      BANNER_TIMEOUT,
    });
  } catch (e) {
    console.error(e);
    res.status(500).send(e);
  }
};
