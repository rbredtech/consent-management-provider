import express from "express";
import path from "path";
import { renderFile } from "ejs";

import { API_VERSION, HTTP_PORT } from "./config";
import router from "./router";
import { logger } from "./util/logger";
import { registry } from "./util/metrics";

const app = express();
app.set("trust proxy", 1);
app.set("views", path.join(__dirname, "../templates"));
app.engine("html", renderFile);
app.engine("js", renderFile);
app.set("view engine", "ejs");

app.use(`/${API_VERSION}`, router);

app.get("/metrics", async (_req, res) => {
  res
    .status(200)
    .contentType(registry.contentType)
    .send(await registry.metrics());
});

app.get("/health", async (_req, res) => {
  const healthcheck = {
    uptime: process.uptime(),
    message: "OK",
    timestamp: Date.now(),
  };

  res.status(200).send(healthcheck);
});

app.listen(HTTP_PORT);
logger.info(`listening on port ${HTTP_PORT}`);
