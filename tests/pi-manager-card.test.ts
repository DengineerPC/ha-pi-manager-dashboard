import { describe, expect, it } from "vitest";
import "../src/register";
import { PiManagerCard } from "../src/pi-manager-card";

describe("PiManagerCard", () => {
  it("renders partial state without requiring optional entities", () => {
    const card = document.createElement("pi-manager-card") as PiManagerCard;
    card.setConfig({ type: "custom:pi-manager-card", title: "Pi A", entities: { online: "binary_sensor.pi_a_online" } });
    card.hass = {
      states: { "binary_sensor.pi_a_online": { entity_id: "binary_sensor.pi_a_online", state: "on", attributes: {} } },
      callService: async () => undefined,
      callWS: async <T>() => [] as T,
    };
    expect(card.shadowRoot?.textContent).toContain("Pi A");
    expect(card.shadowRoot?.textContent).toContain("Online");
  });

  it("renders offline state and confirmation-marked dangerous actions", () => {
    const card = document.createElement("pi-manager-card") as PiManagerCard;
    card.setConfig({
      type: "custom:pi-manager-card",
      entities: {
        online: "binary_sensor.pi_a_online",
        install_updates: "button.pi_a_install_updates",
        restart_smbd: "button.pi_a_restart_smbd",
      },
    });
    card.hass = {
      states: {
        "binary_sensor.pi_a_online": { entity_id: "binary_sensor.pi_a_online", state: "off", attributes: {} },
        "button.pi_a_install_updates": { entity_id: "button.pi_a_install_updates", state: "unknown", attributes: {} },
        "button.pi_a_restart_smbd": { entity_id: "button.pi_a_restart_smbd", state: "unknown", attributes: {} },
      },
      callService: async () => undefined,
      callWS: async <T>() => [] as T,
    };
    expect(card.shadowRoot?.textContent).toContain("Offline");
    expect((card.shadowRoot?.querySelector('button[data-action="install_updates"]') as HTMLButtonElement | null)?.dataset.dangerous).toBe("true");
    expect((card.shadowRoot?.querySelector('button[data-action="restart_smbd"]') as HTMLButtonElement | null)?.dataset.dangerous).toBe("true");
    expect(card.shadowRoot?.textContent).toContain("Danger zone");
  });

  it("renders only the configured host actions and never a fleet action", () => {
    const card = document.createElement("pi-manager-card") as PiManagerCard;
    card.setConfig({
      type: "custom:pi-manager-card",
      title: "Pi A",
      entities: {
        online: "binary_sensor.pi_a_online",
        preview_upgrade: "button.pi_a_preview_upgrade",
        dist_upgrade: "button.pi_a_dist_upgrade",
      },
    });
    card.hass = {
      states: {
        "binary_sensor.pi_a_online": { entity_id: "binary_sensor.pi_a_online", state: "on", attributes: {} },
        "button.pi_a_preview_upgrade": { entity_id: "button.pi_a_preview_upgrade", state: "unknown", attributes: {} },
        "button.pi_a_dist_upgrade": { entity_id: "button.pi_a_dist_upgrade", state: "unknown", attributes: {} },
      },
      callService: async () => undefined,
      callWS: async <T>() => [] as T,
    };
    expect(card.shadowRoot?.querySelectorAll("button[data-action]")).toHaveLength(2);
    expect(card.shadowRoot?.textContent).not.toContain("All Pis");
  });
});
