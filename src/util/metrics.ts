import { Counter, Registry } from "prom-client";

const registry = new Registry();

const consentCounterMetric = new Counter({
  name: "consent_management_consent",
  help: "Consent decision made",
  labelNames: ["consent", "channel"] as const,
});

const loadedCounterMetric = new Counter({
  name: "consent_management_loaded",
  help: "Consent Management is loaded",
  labelNames: ["channel", "withBanner"] as const,
});

const configuredCounterMetric = new Counter({
  name: "consent_management_configured",
  help: "Consent Management is configured",
  labelNames: ["type", "channel"] as const,
});

registry.registerMetric(consentCounterMetric);
registry.registerMetric(loadedCounterMetric);
registry.registerMetric(configuredCounterMetric);

export {
  registry,
  consentCounterMetric,
  loadedCounterMetric,
  configuredCounterMetric,
};
