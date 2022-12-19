import { Request, Response } from "express";

import { logger } from "../util/logger";

import { getTemplateValues } from "./util/getTemplateValues";

export const tcfapiController = async (req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("Cache-Control", "no-store");

  try {
    const values = getTemplateValues(req, "3rd-party");
    res.render("tcfapi.js", values);
  } catch (e) {
    logger.error(e);
    res.status(500).send(e);
  }
};
