const { CMP_ENABLED, CMP_ENABLED_SAMPLING_THRESHOLD_PERCENT, CONSENT_COOKIE_NAME, CONSENT_HOST, COOKIE_DOMAIN, TECH_COOKIE_MIN, TECH_COOKIE_NAME, CONSENT_PATH, BANNER_TIMEOUT } =
  process.env

export function replaceTemplateVariables(template: string): string {
  return template
    .replaceAll("{{CMP_ENABLED}}", CMP_ENABLED ?? "")
    .replaceAll("{{CMP_ENABLED_SAMPLING_THRESHOLD_PERCENT}}", CMP_ENABLED_SAMPLING_THRESHOLD_PERCENT ?? "")
    .replaceAll("{{CONSENT_HOST}}", CONSENT_HOST ?? "")
    .replaceAll("{{CONSENT_PATH}}", CONSENT_PATH ?? "")
    .replaceAll("{{CONSENT_COOKIE_NAME}}", CONSENT_COOKIE_NAME ?? "")
    .replaceAll("{{CONSENT_COOKIE_VALUE}}", req.cookies[String(CONSENT_COOKIE_NAME)] ?? "")
    .replaceAll("{{TECH_COOKIE_NAME}}", TECH_COOKIE_NAME ?? "")
    .replaceAll("{{TECH_COOKIE_VALUE}}", techCookieValue)
    .replaceAll("{{TECH_COOKIE_MIN}}", TECH_COOKIE_MIN ?? "")
    .replaceAll("{{BANNER_TIMEOUT}}", BANNER_TIMEOUT ?? "");
}
