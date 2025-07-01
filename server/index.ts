import ejs, { renderFile } from "ejs";
import express from "express";
import path from "path";
import yargs from "yargs";

import { fileURLToPath } from "url";
import router from "./router.js";

ejs.delimiter = "*";
ejs.openDelimiter = "__ejs(/";
ejs.closeDelimiter = "/);";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set("trust proxy", 1);
app.set("views", path.join(__dirname, "../src"));
app.engine("html", renderFile);
app.engine("js", renderFile);
app.set("view engine", "ejs");

app.use(`/`, router);

app.get("/health", async (_req, res) => {
  res.status(200).send({
    uptime: process.uptime(),
    message: "OK",
    timestamp: Date.now(),
  });
});

const port = yargs(process.argv.slice(2)).parseSync().port || 3000;

app.listen(port);
console.info(`serving CMP scripts at http://localhost:${port}`);
