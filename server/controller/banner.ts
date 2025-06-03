import { Request, Response } from "express";

import { BANNER_TIMEOUT } from "../config.js";
import { logger } from "../util/logger.js";

export const bannerController = async (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/javascript");

  try {
    res.render("banner.js", {
      BANNER_TIMEOUT,
    });
  } catch (e) {
    logger.error(e);
    res.status(500).send(e);
  }
};
