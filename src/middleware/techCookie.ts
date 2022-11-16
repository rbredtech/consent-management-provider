import { NextFunction, Request, Response } from "express";

import { COOKIE_DOMAIN, COOKIE_MAXAGE, TECH_COOKIE_NAME } from "../config";
import { logger } from "../util/logger";

export type TechCookie = number | undefined;

export function techCookieMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const techCookie: TechCookie = req.params.xt
    ? Number(req.params.xt)
    : req.cookies[TECH_COOKIE_NAME];

  if (techCookie && techCookie < Date.now()) {
    logger.debug(
      `got valid tech cookie: ${techCookie < Date.now()}, ${techCookie}`
    );
    req.timestamp = techCookie;
    return next();
  }

  const timestamp = Date.now();
  logger.debug(`setting new tech cookie ${timestamp}`);
  res.cookie(TECH_COOKIE_NAME, timestamp, {
    maxAge: COOKIE_MAXAGE,
    domain: COOKIE_DOMAIN,
  });
  req.timestamp = timestamp;
  return next();
}
