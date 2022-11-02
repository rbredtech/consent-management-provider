var argv = require("yargs").argv;
var express = require("express");
var dotenv = require("dotenv");
var ejs = require("ejs");

var port = argv.port || 8080;

function setHeaders(res){
  res.append('Access-Control-Allow-Origin', '*');
  res.append('Access-Control-Allow-Headers', 'Content-Type');
  res.append('Content-Type', 'application/vnd.hbbtv.xhtml+xml');
}

dotenv.config();
const { HTTP_HOST } = process.env;

var app = express();
app.use(express.static(".", { setHeaders: setHeaders }));
app.set("views", ".");
app.set("view engine", "ejs");

app.get("/*", (_req, res) => {
  res.render("index", { CONSENT_SERVER_HOST: HTTP_HOST})
  res.sendFile("index.html", { root: "." });
});

var server = app.listen(port, function () {
  if (!argv.silent) {
    console.log(`Consent Management Demo is available on http://localhost:${server.address().port}`);
  }
});
