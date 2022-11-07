import * as dotenv from "dotenv";

import { EnvVar } from "../util/env";

dotenv.config();

export const HTTP_PORT = new EnvVar("HTTP_PORT").getStringOrFail();
export const HTTP_HOST = new EnvVar("HTTP_HOST").getStringOrFail();
export const COOKIE_DOMAIN = new EnvVar("COOKIE_DOMAIN").getStringOrFail();
export const COOKIE_NAME = new EnvVar("COOKIE_NAME").getStringOrDefault(
  "xconsent"
);
export const COOKIE_MAXAGE = new EnvVar("COOKIE_MAXAGE").getNumberOrDefault(
  1000 * 60 * 60 * 24 * 365 * 2 // 2 years
);
export const TECH_COOKIE_NAME = new EnvVar(
  "TECH_COOKIE_NAME"
).getStringOrDefault("xt");
export const TECH_COOKIE_MIN = new EnvVar("TECH_COOKIE_MIN").getNumberOrDefault(
  1000 * 60 * 60 * 24 * 365 * 2 // 2 years
);