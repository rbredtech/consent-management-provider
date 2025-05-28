var argv = require("yargs").argv;
var ejs = require("ejs");
var express = require("express");
var dotenv = require("dotenv");
var browserRefreshClient = require("browser-refresh-client");

ejs.delimiter = "*";
ejs.openDelimiter = "__ejs(/";
ejs.closeDelimiter = "/);";

var port = argv.port || 8000;

dotenv.config();
const { BROWSER_REFRESH_URL, API_VERSION, HTTP_HOST, HTTP_PROTOCOL } = process.env;

var app = express();
app.use(express.static("."));
app.set("views", ".");
app.set("view engine", "ejs");

app.get("/*", (req, res) => {
  res.setHeader("Content-Type", "application/vnd.hbbtv.xhtml+xml");
  res.render("index", {
    CONSENT_SERVER_HOST: HTTP_HOST,
    BROWSER_REFRESH_URL,
    API_VERSION,
    HTTP_PROTOCOL,
    BANNER_SUFFIX: req.query.bannerSuffix,
    CHANNEL_ID: req.query.channelId || "9999",
  });
});

var server = app.listen(port, function () {
  if (!argv.silent) {
    console.log(`Consent Management Demo is available on http://localhost:${server.address().port}`);
  }

  setTimeout(function () {
    if (process.send) {
      process.send({
        event: "online",
        url: `http://localhost:${server.address().port}`,
      });
    }
  }, 1000);
});

browserRefreshClient.enableSpecialReload("templates/*.js templates/*.html").onFileModified(function () {
  browserRefreshClient.refreshPage();
});
