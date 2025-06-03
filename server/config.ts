import { EnvVar } from "./util/env.js";

export const CONSENT_HOST = new EnvVar("CONSENT_HOST").getStringOrFail();
export const VERSION_PATH = new EnvVar("VERSION_PATH").getStringOrFail();
export const COOKIE_DOMAIN = new EnvVar("COOKIE_DOMAIN").getStringOrFail();
export const CONSENT_COOKIE_NAME = new EnvVar("CONSENT_COOKIE_NAME").getStringOrFail();
export const TECH_COOKIE_NAME = new EnvVar("TECH_COOKIE_NAME").getStringOrFail();
export const TECH_COOKIE_MIN = new EnvVar("TECH_COOKIE_MIN").getStringOrFail();
export const CMP_ENABLED_SAMPLING_THRESHOLD_PERCENT = new EnvVar("CMP_ENABLED_SAMPLING_THRESHOLD_PERCENT").getStringOrFail();
export const BANNER_TIMEOUT = new EnvVar("BANNER_TIMEOUT").getStringOrFail();
export const CMP_ENABLED = new EnvVar("CMP_ENABLED").getStringOrFail();
