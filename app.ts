import ejs, { renderFile } from "ejs";
import express from "express";
import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import yargs from "yargs";

ejs.delimiter = "*";
ejs.openDelimiter = "__ejs(/";
ejs.closeDelimiter = "/);";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.set("views", path.join(__dirname, "/src"));
app.engine("html", renderFile);
app.engine("js", renderFile);
app.set("view engine", "ejs");

const {
  CMP_ENABLED,
  CONSENT_HOST,
  CONSENT_PATH,
  TECH_COOKIE_NAME,
  TECH_COOKIE_MIN_AGE,
  CONSENT_COOKIE_MAX_AGE,
  CONSENT_COOKIE_NAME,
  CMP_ENABLED_SAMPLING_THRESHOLD_PERCENT,
  BANNER_TIMEOUT
} = process.env;

app.get("", function (_req, res) {
  res.sendStatus(200);
});

app.get(/\/.{1,}/ , function(req, res) {
  const path = __dirname + "/src" + req.path.replace(CONSENT_PATH ?? "/", "/");
  if (!existsSync(path)) {
    res.sendStatus(404);
    return;
  }

  res.render(path, {
    CMP_ENABLED,
    CONSENT_HOST,
    CONSENT_PATH,
    TECH_COOKIE_NAME,
    TECH_COOKIE_MIN_AGE,
    CONSENT_COOKIE_MAX_AGE,
    CONSENT_COOKIE_NAME,
    CMP_ENABLED_SAMPLING_THRESHOLD_PERCENT,
    BANNER_TIMEOUT,
  });
});

const port = yargs(process.argv.slice(2)).parseSync().port || 3000;

app.listen(port);
console.info(`serving CMP scripts at http://localhost:${port}`);
