import cookieParser from "cookie-parser";
import cors from "cors";
import { Router } from "express";

import {
  iframeController,
  loaderController,
  managerController,
  managerIframeController,
  removeConsentController,
  setConsentController,
  bannerController,
} from "./controller";

import { loggerMiddleware, techCookieMiddleware, channelMiddleware } from "./middleware";

const router = Router();

router.use(cors());
router.use(cookieParser());
router.use(loggerMiddleware);
router.use(techCookieMiddleware);
router.use(channelMiddleware);

router.get("/loader.js", loaderController);
router.get("/banner.js", bannerController);
router.get("/iframe.html", iframeController);
router.get(["/manager.js", "/mini-cmp.js"], managerController);
router.get("/manager-iframe.js", managerIframeController);
router.get("/set-consent", setConsentController);
router.get("/remove-consent", removeConsentController);

export default router;
