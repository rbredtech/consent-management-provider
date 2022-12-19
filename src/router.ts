import cookieParser from "cookie-parser";
import cors from "cors";
import { Router } from "express";

import {
  cmpController,
  bannerController,
  iframeController,
  tcfapiController,
  tcfapiIframeController,
  setConsentController,
  removeConsentController,
} from "./controller";

import { loggerMiddleware, techCookieMiddleware, channelMiddleware } from "./middleware";

const router = Router();

router.use(cors());
router.use(cookieParser());
router.use(loggerMiddleware);
router.use(techCookieMiddleware);
router.use(channelMiddleware);

router.get("/cmp.js", cmpController);
router.get("/tcfapi.js", tcfapiController);
router.get("/tcfapi-iframe.js", tcfapiIframeController);
router.get("/iframe.html", iframeController);
router.get("/set-consent", setConsentController);
router.get("/remove-consent", removeConsentController);
router.get("/banner.js", bannerController);

export default router;
