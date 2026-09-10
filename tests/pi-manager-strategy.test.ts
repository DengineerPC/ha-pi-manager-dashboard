import { describe, expect, it } from "vitest";
import { PiManagerDashboardStrategy } from "../src/pi-manager-strategy";
import { EntityRegistryEntry, Hass } from "../src/types";

function hassWith(registry: { devices: unknown[]; entities: EntityRegistryEntry[] }): Hass {
  return {
    states: {},
    callService: async () => undefined,
    callWS: async <T>(message: Record<string, unknown>) => (message.type === "config/device_registry/list" ? registry.devices : registry.entities) as T,
  };
}

describe("Pi Manager dashboard strategy", () => {
  it("discovers multiple Pi Manager devices without hard-coded entity ids", async () => {
    const hass = hassWith({
      devices: [
        { id: "a", name: "Pi A", identifiers: [["pi_manager", "machine-a"]] },
        { id: "b", name: "Pi B", identifiers: [["pi_manager", "machine-b"]] },
        { id: "other", name: "Other", identifiers: [["other", "x"]] },
      ],
      entities: [
        { entity_id: "sensor.a_cpu", unique_id: "machine-a_cpu_usage", device_id: "a" },
        { entity_id: "binary_sensor.a_online", unique_id: "machine-a_online", device_id: "a" },
        { entity_id: "sensor.b_cpu", unique_id: "machine-b_cpu_usage", device_id: "b" },
      ],
    });
    const dashboard = await PiManagerDashboardStrategy.generate({}, hass);
    expect(dashboard.views).toHaveLength(3);
    expect(JSON.stringify(dashboard)).toContain("sensor.a_cpu");
    expect(JSON.stringify(dashboard)).not.toContain("other");
    expect(JSON.stringify(dashboard)).not.toContain("sensor.test");
  });

  it("generates an empty state when no host is configured", async () => {
    const dashboard = await PiManagerDashboardStrategy.generate({}, hassWith({ devices: [], entities: [] }));
    expect(dashboard.views[0].cards[0].type).toBe("markdown");
  });
});
