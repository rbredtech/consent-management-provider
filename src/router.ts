import cookieParser from "cookie-parser";
import cors from "cors";
import { Router } from "express";

import {
  bannerController,
  cmpController,
  iframeController,
  removeConsentController,
  setConsentController,
  tcfapiController,
  tcfapiIframeController,
} from "./controller";

import { loggerMiddleware, techCookieMiddleware, channelMiddleware } from "./middleware";

const router = Router();

router.use(cors());
router.use(cookieParser());
router.use(loggerMiddleware);
router.use(techCookieMiddleware);
router.use(channelMiddleware);

router.get("/banner.js", bannerController);
router.get("/cmp.js", cmpController);
router.get("/iframe.html", iframeController);
router.get("/remove-consent", removeConsentController);
router.get("/set-consent", setConsentController);
router.get("/tcfapi.js", tcfapiController);
router.get("/tcfapi-iframe.js", tcfapiIframeController);

export default router;
