import { renderFile } from "ejs";
import { Request, Response } from "express";
import path from "path";

import { getTemplateValues } from "./util/getTemplateValues";

export const managerIframeController = async (req: Request, res: Response) => {
  const channelId = Number(req.query.channelId);

  if (req.query.channelId && isNaN(channelId)) {
    res.status(500).send({ error: "query parameter channelId must be numeric" });
    return;
  }

  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("Cache-Control", "no-store");

  try {
    const values = getTemplateValues(req, "iframe");

    const managerJs = await renderFile(path.join(__dirname, "../templates/manager.js"), values);
    const iframeMsgJs = await renderFile(path.join(__dirname, "../templates/iframe-msg.js"), {
      BANNER_TIMEOUT: values.BANNER_TIMEOUT,
    });

    res.send(`${managerJs}${iframeMsgJs}`);
  } catch (e) {
    res.status(500).send(e);
  }
};
