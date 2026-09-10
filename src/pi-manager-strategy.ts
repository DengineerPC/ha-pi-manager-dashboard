import { DashboardCard, DashboardConfig, DashboardView, DeviceRegistryEntry, EntityRegistryEntry, Hass, entityMapForDevice, isPiManagerDevice } from "./types";

export class PiManagerDashboardStrategy extends HTMLElement {
  static getCreateSuggestions(_hass: Hass): { title: string; icon: string } {
    return { title: "Pi Manager", icon: "mdi:raspberry-pi" };
  }

  static getConfigElement(): HTMLElement {
    return document.createElement("pi-manager-editor");
  }

  static configRequired = false;

  static async generate(config: { title?: string } = {}, hass: Hass): Promise<DashboardConfig> {
    const [devices, entities] = await Promise.all([
      hass.callWS<DeviceRegistryEntry[]>({ type: "config/device_registry/list" }),
      hass.callWS<EntityRegistryEntry[]>({ type: "config/entity_registry/list" }),
    ]);
    const piDevices = devices.filter(isPiManagerDevice);
    const cards: DashboardCard[] = [];
    for (const device of piDevices) {
      const map = entityMapForDevice(device.id, entities);
      cards.push({ type: "custom:pi-manager-card", title: device.name ?? "Pi Manager", device_id: device.id, entities: map });
    }
    const views: DashboardView[] = [
      {
        title: "Overview",
        path: "overview",
        icon: "mdi:view-dashboard",
        cards: piDevices.length ? [{ type: "grid", columns: 1, cards }] : [{ type: "markdown", content: "No Pi Manager hosts are configured yet." }],
      },
    ];
    for (const device of piDevices) {
      const map = entityMapForDevice(device.id, entities);
      views.push({
        title: device.name ?? "Pi Manager host",
        path: `pi-${slugPath(device.id)}`,
        icon: "mdi:raspberry-pi",
        cards: hostCards(device, map),
      });
    }
    return { title: config.title ?? "Pi Manager", views };
  }
}

function hostCards(device: DeviceRegistryEntry, map: Record<string, string>): DashboardCard[] {
  const entityCards = [
    ["Health", [map.online, map.cpu_usage, map.cpu_temperature, map.memory_usage, map.load_1, map.uptime]],
    ["Storage", Object.entries(map).filter(([key]) => key.startsWith("filesystem_")).map(([, entity]) => entity)],
    ["Network", Object.entries(map).filter(([key]) => key.startsWith("network_")).map(([, entity]) => entity)],
    ["Updates", [map.updates_available, map.security_updates, map.reboot_required]],
    [
      "Package maintenance",
      [
        map.package_job_state,
        map.package_job_summary,
        map.package_audit,
        map.held_packages,
        map.failed_service_count,
        map.preview_upgrade,
        map.preview_dist_upgrade,
        map.preview_autoremove,
      ],
    ],
    ["Services", Object.entries(map).filter(([key]) => key.startsWith("service_")).map(([, entity]) => entity)],
  ] as const;
  return [
    { type: "custom:pi-manager-card", title: device.name ?? "Pi Manager", device_id: device.id, entities: map },
    ...entityCards
      .filter(([, ids]) => ids.some(Boolean))
      .map(([title, ids]) => ({ type: "entities", title, entities: ids.filter(Boolean) })),
  ];
}

function slugPath(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "host";
}
