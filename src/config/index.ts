import { EnvVar } from "../util/env";

export const HTTP_PORT = new EnvVar("HTTP_PORT").getStringOrFail();
export const HTTP_HOST = new EnvVar("HTTP_HOST").getStringOrFail();
export const API_VERSION = new EnvVar("API_VERSION").getStringOrFail();
export const COOKIE_DOMAIN = new EnvVar("COOKIE_DOMAIN").getStringOrFail();
export const COOKIE_NAME = new EnvVar("COOKIE_NAME").getStringOrDefault("xconsent");
export const CONSENT_COOKIE_NAME = new EnvVar("CONSENT_COOKIE_NAME").getStringOrDefault("agttconsent");
export const COOKIE_MAXAGE = new EnvVar("COOKIE_MAXAGE").getNumberOrDefault(
  1000 * 60 * 60 * 24 * 365 * 2, // 2 years
);
export const GENERIC_CHANNEL_NAME = new EnvVar("GENERIC_CHANNEL_NAME").getStringOrDefault("dieser Sender");
export const TECH_COOKIE_NAME = new EnvVar("TECH_COOKIE_NAME").getStringOrDefault("xt");
export const TECH_COOKIE_MIN = new EnvVar("TECH_COOKIE_MIN").getNumberOrDefault(
  1000 * 60 * 60 * 24 * 2, // 2 days
);
export const CMP_ENABLED_SAMPLING_THRESHOLD_PERCENT = new EnvVar(
  "CMP_ENABLED_SAMPLING_THRESHOLD_PERCENT",
).getNumberOrDefault(15);
export const BANNER_TIMEOUT = new EnvVar("BANNER_TIMEOUT").getNumberOrDefault(
  1000 * 60 * 2, // 2 mins
);
export const CMP_ENABLED = new EnvVar("CMP_ENABLED").getBooleanOrDefault(true);
export const TRACKING_PROTOCOL = new EnvVar("TRACKING_PROTOCOL").getStringOrDefault("http");
export const TRACKING_HOST_CONSENT = new EnvVar("TRACKING_HOST_CONSENT").getStringOrDefault("session.tvping.com");
export const TRACKING_HOST_NO_CONSENT = new EnvVar("TRACKING_HOST_NO_CONSENT").getStringOrDefault(
  "session-cl.tvping.com",
);
export const TRACKING_VERSION = new EnvVar("TRACKING_VERSION").getStringOrDefault("v2");
