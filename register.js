import { register } from "node:module";
import { setUncaughtExceptionCaptureCallback } from "node:process";
import { pathToFileURL } from "node:url";

setUncaughtExceptionCaptureCallback((err) => {
  console.error(err);
  process.exit(1);
});
register("ts-node/esm", pathToFileURL("./"));
