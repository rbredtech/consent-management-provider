import { Request, Response } from "express";

import { BANNER_TIMEOUT } from "../config";
import { logger } from "../util/logger";

export const bannerAgfController = async (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/javascript");

  try {
    res.render("banner-agf.js", {
      BANNER_TIMEOUT,
    });
  } catch (e) {
    logger.error(e);
    res.status(500).send(e);
  }
};
