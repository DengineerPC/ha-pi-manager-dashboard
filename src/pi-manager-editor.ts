import { DeviceRegistryEntry, EntityRegistryEntry, Hass, PiManagerCardConfig, entityMapForDevice, isPiManagerDevice } from "./types";

export class PiManagerEditor extends HTMLElement {
  private _hass?: Hass;
  private _config: PiManagerCardConfig = { type: "custom:pi-manager-card" };
  private _root: ShadowRoot;
  private _devices: DeviceRegistryEntry[] = [];
  private _entities: EntityRegistryEntry[] = [];

  constructor() {
    super();
    this._root = this.attachShadow({ mode: "open" });
  }

  setConfig(config: PiManagerCardConfig): void {
    this._config = { ...config };
    this._render();
  }

  set hass(value: Hass) {
    this._hass = value;
    void this._loadDevices();
  }

  private async _loadDevices(): Promise<void> {
    if (!this._hass) return;
    const [devices, entities] = await Promise.all([
      this._hass.callWS<DeviceRegistryEntry[]>({ type: "config/device_registry/list" }),
      this._hass.callWS<EntityRegistryEntry[]>({ type: "config/entity_registry/list" }),
    ]);
    this._devices = devices.filter(isPiManagerDevice);
    this._entities = entities;
    this._render();
  }

  private _render(): void {
    this._root.innerHTML = `<style>:host{display:block}.row{display:flex;flex-direction:column;gap:6px}label{font-weight:600}select{background:var(--card-background-color);border:1px solid var(--divider-color);border-radius:6px;color:var(--primary-text-color);padding:8px}</style><div class="row"><label for="device">Pi Manager device</label><select id="device"><option value="">Choose a device</option>${this._devices.map((device) => `<option value="${escapeHtml(device.id)}"${device.id === this._config.device_id ? " selected" : ""}>${escapeHtml(device.name ?? device.id)}</option>`).join("")}</select></div>`;
    this._root.querySelector("select")?.addEventListener("change", (event) => {
      const value = (event.target as HTMLSelectElement).value;
      const entities = value ? entityMapForDevice(value, this._entities) : undefined;
      this.dispatchEvent(new CustomEvent("config-changed", {
        bubbles: true,
        composed: true,
        detail: { config: { ...this._config, device_id: value, ...(entities ? { entities } : {}) } },
      }));
    });
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}
