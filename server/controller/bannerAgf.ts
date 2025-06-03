import { Request, Response } from "express";

const { BANNER_TIMEOUT } = process.env;

export const bannerAgfController = async (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/javascript");

  try {
    res.render("banner-agf.js", {
      BANNER_TIMEOUT,
    });
  } catch (e) {
    console.error(e);
    res.status(500).send(e);
  }
};
