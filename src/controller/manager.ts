import ejs from "ejs";
import { Request, Response } from "express";
import path from "path";

import { BANNER_TIMEOUT } from "../config";

import { logger } from "../util/logger";
import { configuredCounterMetric } from "../util/metrics";

import { getTemplateValues } from "./util/getTemplateValues";

export const managerController = async (req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("Cache-Control", "no-store");

  configuredCounterMetric.labels({ type: "3rd-party" }).inc();

  try {
    const values = getTemplateValues(req);

    let bannerJs: string | undefined = undefined;
    let kbdJs: string | undefined = undefined;

    // add showBanner if needed
    if (req.withBanner) {
      values.BANNER_NO_IFRAME = await ejs.renderFile(
        path.join(__dirname, "../../templates/show-banner-cmd.ejs"),
        { BANNER_TIMEOUT }
      );
      bannerJs = await ejs.renderFile(
        path.join(__dirname, "../../templates/banner.ejs")
      );
      kbdJs = await ejs.renderFile(
        path.join(__dirname, "../../templates/kbd.ejs")
      );
    } else {
      values.BANNER_NO_IFRAME = "";
    }
    const cmpJs = await ejs.renderFile(
      path.join(__dirname, "../../templates/mini-cmp.ejs"),
      values
    );

    res.send(bannerJs && kbdJs ? `${bannerJs}${kbdJs}${cmpJs}` : cmpJs);
  } catch (e) {
    logger.error(e);
    res.status(500).send(e);
  }
};
