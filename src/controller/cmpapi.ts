import { Request, Response } from "express";

import { logger } from "../util/logger";

import { getTemplateValues } from "./util/getTemplateValues";

export const cmpapiController = async (req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("Cache-Control", "no-store");

  try {
    const values = getTemplateValues(req);
    res.render("cmpapi.js", values);
  } catch (e) {
    logger.error(e);
    res.status(500).send(e);
  }
};
