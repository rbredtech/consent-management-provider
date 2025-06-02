import cookieParser from "cookie-parser";
import cors from "cors";
import { Router } from "express";

import {
  bannerAgfController,
  bannerController,
  cmpapiController,
  cmpController,
  cmpWithTrackingController,
  iframeController,
  removeConsentController,
  setConsentController,
} from "./controller";

const router = Router();

router.use(cors());
router.use(cookieParser());

router.get("/banner.js", bannerController);
router.get("/banner-agf.js", bannerAgfController);
router.get("/cmp.js", cmpController);
router.get("/cmp-with-tracking.js", cmpWithTrackingController);
router.get("/cmpapi.js", cmpapiController);
router.get("/iframe.html", iframeController);
router.get("/remove-consent", removeConsentController);
router.get("/set-consent", setConsentController);

export default router;
