import cookieParser from "cookie-parser";
import cors from "cors";
import { Router } from "express";

import {
  bannerController,
  cmpController,
  cmpWithTrackingController,
  iframeController,
  removeConsentController,
  setConsentController,
  cmpapiController,
  resetOldConsentController,
} from "./controller";

import { loggerMiddleware, channelMiddleware } from "./middleware";

const router = Router();

router.use(cors());
router.use(cookieParser());
router.use(loggerMiddleware);
router.use(channelMiddleware);

router.get("/banner.js", bannerController);
router.get("/cmp.js", cmpController);
router.get("/cmp-with-tracking.js", cmpWithTrackingController);
router.get("/cmpapi.js", cmpapiController);
router.get("/iframe.html", iframeController);
router.get("/remove-consent", removeConsentController);
router.get(["/set-consent", "/migrate"], setConsentController);
router.get("/reset-old-consent", resetOldConsentController);

export default router;
