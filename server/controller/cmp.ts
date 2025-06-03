import { renderFile } from "ejs";
import { Request, Response } from "express";
import path from "path";
import { fileURLToPath } from "url";

import { CONSENT_COOKIE_NAME, CONSENT_HOST, COOKIE_DOMAIN, TECH_COOKIE_NAME, VERSION_PATH } from "../config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const cmpController = async (req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/javascript");

  let techCookieValue = req.cookies[TECH_COOKIE_NAME];
  if (!techCookieValue) {
    techCookieValue = Date.now();
    res.cookie(TECH_COOKIE_NAME, Date.now(), {
      maxAge: 63072000,
      domain: COOKIE_DOMAIN,
    });
  }

  try {
    const cmpJs = (
      await renderFile(path.join(__dirname, "../../src/cmp.js"), {
        VERSION_PATH,
        CONSENT_HOST,
      })
    )
      .replaceAll("{{CONSENT_COOKIE_CONTENT}}", req.cookies[CONSENT_COOKIE_NAME] ?? "")
      .replaceAll("{{TECH_COOKIE_VALUE}}", techCookieValue ?? "");

    res.send(cmpJs);
  } catch (e) {
    console.error(e);
    res.status(500).send(e);
  }
};
