import { Request, Response } from "express";

const { BANNER_TIMEOUT } = process.env;

export const bannerController = async (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/javascript");

  try {
    res.render("banner.js", {
      BANNER_TIMEOUT,
    });
  } catch (e) {
    console.error(e);
    res.status(500).send(e);
  }
};
