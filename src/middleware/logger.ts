import { NextFunction, Request, Response } from "express";

import { logger } from "../util/logger";

export function loggerMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  logger.debug(`url ${req.originalUrl} cookies: ${JSON.stringify(req.cookies)}`);
  next();
}
