import { renderFile } from "ejs";
import { Request, Response } from "express";
import path from "path";
import { fileURLToPath } from "url";

const { CONSENT_HOST, COOKIE_DOMAIN, TECH_COOKIE_NAME, CONSENT_PATH } = process.env;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const cmpController = async (req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/javascript");

  let techCookieValue = req.cookies?.[String(TECH_COOKIE_NAME)];
  if (!techCookieValue) {
    techCookieValue = Date.now();
    res.cookie(String(TECH_COOKIE_NAME), Date.now(), {
      maxAge: 63072000000,
      domain: COOKIE_DOMAIN,
    });
  }

  try {
    const cmpJs = (await renderFile(path.join(__dirname, "../../src/cmp.js")))
      .replaceAll("{{CONSENT_HOST}}", CONSENT_HOST ?? "")
      .replaceAll("{{CONSENT_PATH}}", CONSENT_PATH ?? "")
      .replaceAll("{{TECH_COOKIE_VALUE}}", techCookieValue);

    res.send(cmpJs);
  } catch (e) {
    console.error(e);
    res.status(500).send(e);
  }
};
