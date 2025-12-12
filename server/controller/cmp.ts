import { renderFile } from "ejs";
import { Request, Response } from "express";
import path from "path";
import { fileURLToPath } from "url";

const { CONSENT_HOST, CONSENT_PATH } = process.env;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const cmpController = async (req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/javascript");

  try {
    const cmpJs = (await renderFile(path.join(__dirname, "../../src/cmp.js")))
      .replaceAll("{{CONSENT_HOST}}", CONSENT_HOST ?? "")
      .replaceAll("{{CONSENT_PATH}}", CONSENT_PATH ?? "");

    res.send(cmpJs);
  } catch (e) {
    console.error(e);
    res.status(500).send(e);
  }
};
