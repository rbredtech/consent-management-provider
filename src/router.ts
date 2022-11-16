import cookieParser from "cookie-parser";
import cors from "cors";
import { Router } from "express";

import {
  iframeController,
  loaderController,
  managerController,
  managerIframeController,
  setConsentController,
} from "./controllers";

import { loggerMiddleware } from "./middleware/logger";
import { techCookieMiddleware } from "./middleware/techCookie";
import { withBannerMiddleware } from "./middleware/withBanner";

const router = Router();

router.use(cors());
router.use(cookieParser());
router.use(loggerMiddleware);
router.use(techCookieMiddleware);

router.get("/loader.js", loaderController);
router.get("/loader-with-banner.js", withBannerMiddleware, loaderController);

router.get("/iframe.html", iframeController);
router.get("/iframe-with-banner.html", withBannerMiddleware, iframeController);

router.get(["/manager.js", "/mini-cmp.js"], managerController);
router.get("/manager-with-banner.js", withBannerMiddleware, managerController);

router.get("/manager-iframe.js", managerIframeController);
router.get(
  "/manager-iframe-with-banner.js",
  withBannerMiddleware,
  managerIframeController
);

router.get("/set-consent", setConsentController);

export default router;
