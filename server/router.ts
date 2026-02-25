import cookieParser from "cookie-parser";
import cors from "cors";
import { Router } from "express";

import { bannerController } from "./controller/banner.js";
import { bannerAgfController } from "./controller/bannerAgf.js";
import { cmpController } from "./controller/cmp.js";
import { cmpapiController } from "./controller/cmpapi.js";
import { iframeController } from "./controller/iframe.js";
import { metaController } from "./controller/meta.js";
import { removeConsentController } from "./controller/removeConsent.js";
import { setConsentController } from "./controller/setConsent.js";

const router = Router();

router.use(cors());
router.use(cookieParser());

router.get("/banner.js", bannerController);
router.get("/banner-agf.js", bannerAgfController);
router.get("/cmp.js", cmpController);
router.get("/cmpapi.js", cmpapiController);
router.get("/iframe.html", iframeController);
router.get("/meta.gif", metaController);
router.get("/remove-consent", removeConsentController);
router.get("/set-consent", setConsentController);

export default router;
