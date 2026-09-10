import { PiManagerCard } from "./pi-manager-card";
import { PiManagerEditor } from "./pi-manager-editor";
import { PiManagerDashboardStrategy } from "./pi-manager-strategy";

declare global {
  interface Window {
    customCards?: Array<Record<string, unknown>>;
    customStrategies?: Array<Record<string, unknown>>;
  }
}

if (!customElements.get("pi-manager-card")) customElements.define("pi-manager-card", PiManagerCard);
if (!customElements.get("pi-manager-editor")) customElements.define("pi-manager-editor", PiManagerEditor);
if (!customElements.get("ll-strategy-dashboard-pi-manager")) {
  customElements.define("ll-strategy-dashboard-pi-manager", PiManagerDashboardStrategy);
}

window.customCards = window.customCards ?? [];
if (!window.customCards.some((item) => item.type === "pi-manager-card")) {
  window.customCards.push({
    type: "pi-manager-card",
    name: "Pi Manager",
    description: "Monitor one managed Raspberry Pi or Debian host.",
    preview: true,
  });
}

window.customStrategies = window.customStrategies ?? [];
if (!window.customStrategies.some((item) => item.type === "pi-manager")) {
  window.customStrategies.push({
    type: "pi-manager",
    strategyType: "dashboard",
    name: "Pi Manager",
    description: "Generate an overview and one view per managed Pi.",
    documentationURL: "https://developers.home-assistant.io/docs/frontend/custom-ui/custom-strategy/",
  });
}

export { PiManagerCard, PiManagerDashboardStrategy, PiManagerEditor };
