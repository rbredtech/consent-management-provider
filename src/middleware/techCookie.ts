import { NextFunction, Request, Response } from "express";

import { COOKIE_DOMAIN, COOKIE_MAXAGE, TECH_COOKIE_NAME } from "../config";
import { logger } from "../util/logger";

export type TechCookie = number | undefined;

export function techCookieMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  {
    const techCookie: TechCookie = req.cookies[TECH_COOKIE_NAME];

    if (techCookie && techCookie < Date.now()) {
      logger.debug(
        `got valid tech cookie: ${techCookie < Date.now()}, ${techCookie}`
      );
      return next();
    }

    logger.debug("setting tech cookie");
    res.cookie(TECH_COOKIE_NAME, Date.now(), {
      maxAge: COOKIE_MAXAGE,
      domain: COOKIE_DOMAIN,
    });
    return next();
  }
}
