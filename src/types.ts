export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
  last_changed?: string;
  last_updated?: string;
}

export interface Hass {
  states: Record<string, HassEntity>;
  config?: { location_name?: string };
  callService: (domain: string, service: string, data?: Record<string, unknown>) => Promise<unknown>;
  callWS: <T = unknown>(message: Record<string, unknown>) => Promise<T>;
  localize?: (key: string, ...args: unknown[]) => string;
}

export interface PiManagerCardConfig {
  type?: string;
  device_id?: string;
  title?: string;
  entities?: Record<string, string>;
}

export interface DeviceRegistryEntry {
  id: string;
  name?: string | null;
  identifiers?: Array<[string, string]>;
  manufacturer?: string | null;
  model?: string | null;
}

export interface EntityRegistryEntry {
  entity_id: string;
  unique_id: string;
  device_id?: string | null;
  platform?: string | null;
  config_entry_id?: string | null;
  disabled_by?: string | null;
}

export interface DashboardCard {
  type: string;
  [key: string]: unknown;
}

export interface DashboardView {
  title: string;
  path: string;
  icon?: string;
  cards: DashboardCard[];
}

export interface DashboardConfig {
  title: string;
  views: DashboardView[];
}

export function isPiManagerDevice(device: DeviceRegistryEntry): boolean {
  return (device.identifiers ?? []).some(([domain]) => domain === "pi_manager");
}

export function entityMapForDevice(
  deviceId: string,
  entities: EntityRegistryEntry[],
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const entity of entities) {
    if (entity.device_id !== deviceId || entity.disabled_by) continue;
    const marker = entity.unique_id.split("_").slice(1).join("_");
    if (marker) {
      result[marker] = entity.entity_id;
      if (marker.startsWith("button_")) result[marker.slice("button_".length)] = entity.entity_id;
    }
  }
  return result;
}
