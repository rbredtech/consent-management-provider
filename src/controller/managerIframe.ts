import ejs from "ejs";
import { Request, Response } from "express";
import path from "path";

import { BANNER_TIMEOUT } from "../config";

import { configuredCounterMetric } from "../util/metrics";
import { getTemplateValues } from "./util/getTemplateValues";

export const managerIframeController = async (req: Request, res: Response) => {
  const channelId = Number(req.query.channelId);

  if (req.query.channelId && isNaN(channelId)) {
    res
      .status(500)
      .send({ error: "query parameter channelId must be numeric" });
    return;
  }

  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("Cache-Control", "no-store");

  configuredCounterMetric.labels({ type: "iframe" }).inc();

  try {
    const values = getTemplateValues(req);
    values.BANNER_NO_IFRAME = "";
    const cmpJs = await ejs.renderFile(
      path.join(__dirname, "../../templates/mini-cmp.ejs"),
      values
    );
    const iframeMsgJs = await ejs.renderFile(
      path.join(__dirname, "../../templates/iframe-msg.ejs"),
      { BANNER_TIMEOUT }
    );

    let bannerJs: string | undefined = undefined;
    if (req.withBanner) {
      bannerJs = await ejs.renderFile(
        path.join(__dirname, "../../templates/banner.ejs")
      );
    }

    res.send(bannerJs ? `${cmpJs}${iframeMsgJs}${bannerJs}` : `${cmpJs}${iframeMsgJs}`);
  } catch (e) {
    res.status(500).send(e);
  }
};
