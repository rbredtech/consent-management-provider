import { renderFile } from "ejs";
import { Request, Response } from "express";
import path from "path";
import { fileURLToPath } from "url";

const { CMP_ENABLED, CMP_ENABLED_SAMPLING_THRESHOLD_PERCENT, CONSENT_COOKIE_NAME, CONSENT_HOST, COOKIE_DOMAIN, TECH_COOKIE_MIN, TECH_COOKIE_NAME, CONSENT_PATH } = process.env;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const cmpapiController = async (req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/javascript");

  const techCookieValue = req.query.x || req.cookies?.[String(TECH_COOKIE_NAME)] || Date.now();
  if (!req.cookies?.[String(TECH_COOKIE_NAME)]) {
    res.cookie(String(TECH_COOKIE_NAME), techCookieValue, {
      maxAge: 63072000000,
      domain: COOKIE_DOMAIN,
    });
  }

  try {
    const cmpapiJs = (await renderFile(path.join(__dirname, "../../src/cmpapi.js")))
      .replaceAll("{{CMP_ENABLED}}", CMP_ENABLED ?? "")
      .replaceAll("{{CMP_ENABLED_SAMPLING_THRESHOLD_PERCENT}}", CMP_ENABLED_SAMPLING_THRESHOLD_PERCENT ?? "")
      .replaceAll("{{CONSENT_HOST}}", CONSENT_HOST ?? "")
      .replaceAll("{{CONSENT_PATH}}", CONSENT_PATH ?? "")
      .replaceAll("{{CONSENT_COOKIE_NAME}}", CONSENT_COOKIE_NAME ?? "")
      .replaceAll("{{CONSENT_COOKIE_VALUE}}", req.cookies?.[String(CONSENT_COOKIE_NAME)] ?? "")
      .replaceAll("{{TECH_COOKIE_NAME}}", TECH_COOKIE_NAME ?? "")
      .replaceAll("{{TECH_COOKIE_VALUE}}", techCookieValue)
      .replaceAll("{{TECH_COOKIE_MIN}}", TECH_COOKIE_MIN ?? "");

    res.send(cmpapiJs);
  } catch (e) {
    console.error(e);
    res.status(500).send(e);
  }
};
