import cookieParser from "cookie-parser";
import cors from "cors";
import { Router } from "express";

import { bannerController } from "./controller/banner.js";
import { bannerAgfController } from "./controller/bannerAgf.js";
import { cmpController } from "./controller/cmp.js";
import { cmpapiController } from "./controller/cmpapi.js";
import { iframeController } from "./controller/iframe.js";

const router = Router();

router.use(cors());
router.use(cookieParser());

router.get("/banner.js", bannerController);
router.get("/banner-agf.js", bannerAgfController);
router.get("/cmp.js", cmpController);
router.get("/cmpapi.js", cmpapiController);
router.get("/iframe.html", iframeController);

export default router;
