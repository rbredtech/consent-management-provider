import { renderFile } from "ejs";
import { Request, Response } from "express";
import path from "path";

import { getTemplateValues } from "./util/getTemplateValues";

export const cmpapiIframeController = async (req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("Cache-Control", "no-store");

  try {
    const values = getTemplateValues(req, "iframe");

    const cmpapiJs = await renderFile(path.join(__dirname, "../templates/cmpapi.js"), values);
    const iframeMsgJs = await renderFile(path.join(__dirname, "../templates/iframe-msg.js"));

    res.send(`${cmpapiJs}${iframeMsgJs}`);
  } catch (e) {
    res.status(500).send(e);
  }
};
