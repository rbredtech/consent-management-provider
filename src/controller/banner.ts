import { Request, Response } from "express";

import { BANNER_TIMEOUT } from "../config";
import { logger } from "../util/logger";

export const bannerController = async (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600, stale-while-revalidate");

  try {
    res.render("banner.js", {
      BANNER_TIMEOUT,
    });
  } catch (e) {
    logger.error(e);
    res.status(500).send(e);
  }
};
