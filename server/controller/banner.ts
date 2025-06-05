import { renderFile } from "ejs";
import { Request, Response } from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { BANNER_TIMEOUT } = process.env;

export const bannerController = async (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/javascript");

  try {
    const bannerJs = (await renderFile(path.join(__dirname, "../../src/banner.js"))).replaceAll("{{BANNER_TIMEOUT}}", BANNER_TIMEOUT ?? "");
    res.send(bannerJs);
  } catch (e) {
    console.error(e);
    res.status(500).send(e);
  }
};
