var argv = require("yargs").argv;
var express = require("express");
var dotenv = require("dotenv");
var browserRefreshClient = require("browser-refresh-client");

var port = argv.port || 8080;

dotenv.config();
const { BROWSER_REFRESH_URL, HTTP_HOST } = process.env;

var app = express();
app.use(express.static("."));
app.set("views", ".");
app.set("view engine", "ejs");

app.get("/*", (_req, res) => {
  res.setHeader("Content-Type", "application/vnd.hbbtv.xhtml+xml");
  res.render("index", { CONSENT_SERVER_HOST: HTTP_HOST, BROWSER_REFRESH_URL });
});

var server = app.listen(port, function () {
  if (!argv.silent) {
    console.log(
      `Consent Management Demo is available on http://localhost:${
        server.address().port
      }`
    );
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

browserRefreshClient.enableSpecialReload("*.ejs").onFileModified(function () {
  browserRefreshClient.refreshPage();
});
