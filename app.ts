import ejs, { renderFile } from "ejs";
import express from "express";
import path from "path";
import { fileURLToPath } from 'url';

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

app.get("*", function(req, res) {
  res.render(__dirname + "/src" + req.path.replace(CONSENT_PATH ?? "/", "/"), {
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

app.listen(3000);
console.info(`serving CMP scripts at http://localhost:3000`);
