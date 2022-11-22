import { NextFunction, Request, Response } from "express";
import { logger } from "../util/logger";

export function withBannerMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  logger.debug("WITH BANNER");
  req.withBanner = true;
  next();
}
