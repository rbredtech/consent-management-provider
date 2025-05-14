import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { setUncaughtExceptionCaptureCallback } from "node:process";

setUncaughtExceptionCaptureCallback((err) => {
  console.error(err);
  process.exit(1);
});
register("ts-node/esm", pathToFileURL("./"));
