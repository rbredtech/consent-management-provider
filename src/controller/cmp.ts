import { renderFile } from "ejs";
import { Request, Response } from "express";
import path from "path";

import { API_VERSION, CONSENT_COOKIE_NAME, COOKIE_DOMAIN, COOKIE_MAXAGE, HTTP_HOST, TECH_COOKIE_NAME } from "../config";

export const cmpController = async (req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("Cache-Control", "no-store");

  let techCookieValue = req.cookies[TECH_COOKIE_NAME];
  if (!techCookieValue) {
    techCookieValue = Date.now();
    res.cookie(TECH_COOKIE_NAME, Date.now(), {
      maxAge: COOKIE_MAXAGE,
      domain: COOKIE_DOMAIN,
    });
  }

  try {
    const cmpJs = (
      await renderFile(path.join(__dirname, "../templates/cmp.js"), {
        VERSION_PATH: API_VERSION ? `/${API_VERSION}/` : "/",
        CONSENT_SERVER_HOST: HTTP_HOST,
        CHANNEL_ID: req.query.channelId,
      })
    )
      .replaceAll("{{CONSENT_COOKIE_CONTENT}}", req.cookies[CONSENT_COOKIE_NAME] ?? "")
      .replaceAll("{{TECH_COOKIE_VALUE}}", techCookieValue ?? "");

    res.send(cmpJs);
  } catch (e) {
    res.status(500).send(e);
  }
};
