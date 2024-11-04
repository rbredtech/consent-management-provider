import { Request, Response } from "express";

import { BANNER_TIMEOUT } from "../config";
import { logger } from "../util/logger";

export const bannerController = async (req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=300");

  try {
    res.render("banner.js", {
      CHANNEL_GROUP: req.channelGroup,
      BANNER_TIMEOUT,
    });
  } catch (e) {
    logger.error(e);
    res.status(500).send(e);
  }
};
