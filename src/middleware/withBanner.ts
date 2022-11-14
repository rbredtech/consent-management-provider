import { NextFunction, Request, Response } from "express";

export function withBannerMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  req.withBanner = true;
  next();
}
