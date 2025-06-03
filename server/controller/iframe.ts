import { renderFile } from "ejs";
import { Request, Response } from "express";
import path from "path";
import { fileURLToPath } from "url";

const { CMP_ENABLED, CMP_ENABLED_SAMPLING_THRESHOLD_PERCENT, CONSENT_COOKIE_NAME, CONSENT_HOST, COOKIE_DOMAIN, TECH_COOKIE_MIN, TECH_COOKIE_NAME, VERSION_PATH } = process.env;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const iframeController = async (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html");

  try {
    const iframeHtml = (
      await renderFile(path.join(__dirname, "../../src/iframe.html"), {
        CONSENT_HOST,
        VERSION_PATH,
        CONSENT_COOKIE_NAME,
        COOKIE_DOMAIN,
        CMP_ENABLED,
        TECH_COOKIE_MIN,
        TECH_COOKIE_NAME,
        CMP_ENABLED_SAMPLING_THRESHOLD_PERCENT,
      })
    )
      .replaceAll("{{CONSENT_COOKIE_CONTENT}}", req.cookies[String(CONSENT_COOKIE_NAME)] ?? "")
      .replaceAll("{{TECH_COOKIE_VALUE}}", req.cookies[String(TECH_COOKIE_NAME)] ?? "");
    res.send(iframeHtml);
  } catch (e) {
    console.error(e);
    res.status(500).send(e);
  }
};
