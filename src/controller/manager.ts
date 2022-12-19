import { renderFile } from "ejs";
import { Request, Response } from "express";
import path from "path";

import { logger } from "../util/logger";

import { getTemplateValues } from "./util/getTemplateValues";

export const managerController = async (req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("Cache-Control", "no-store");

  try {
    const values = getTemplateValues(req, "3rd-party");
    const cmpJs = await renderFile(path.join(__dirname, "../templates/tcfapi.js"), values);

    // add banner if needed
    let bannerJs: string | undefined = undefined;
    if (req.withBanner) {
      bannerJs = await renderFile(path.join(__dirname, "../templates/banner.js"), {
        CHANNEL_NAME: req.channelName,
        IS_PRO7: req.isp7,
      });
    }

    res.send(bannerJs ? `${cmpJs}${bannerJs}` : cmpJs);
  } catch (e) {
    logger.error(e);
    res.status(500).send(e);
  }
};
