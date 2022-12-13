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

    let bannerJs: string | undefined = undefined;
    let kbdJs: string | undefined = undefined;

    // add showBanner if needed
    if (req.withBanner) {
      bannerJs = await renderFile(path.join(__dirname, "../../templates/banner.js"), {
        CHANNEL_NAME: req.channelName,
        IS_PRO7: req.isp7,
      });
      kbdJs = await renderFile(path.join(__dirname, "../../templates/kbd.js"));
    }

    const cmpJs = await renderFile(path.join(__dirname, "../../templates/mini-cmp.js"), values);

    res.send(bannerJs && kbdJs ? `${bannerJs}${kbdJs}${cmpJs}` : cmpJs);
  } catch (e) {
    logger.error(e);
    res.status(500).send(e);
  }
};
