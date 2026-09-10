// src/pi-manager-card.ts
var STYLE = `
:host { display: block; color: var(--primary-text-color); }
.card { background: var(--ha-card-background, var(--card-background-color)); border-radius: var(--ha-card-border-radius, 12px); box-shadow: var(--ha-card-box-shadow, none); padding: 16px; }
.heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.heading h2 { margin: 0; font-size: 1.1rem; }
.status { color: var(--secondary-text-color); font-size: .9rem; }
.status.online { color: var(--state-active-color, var(--success-color, #2e7d32)); }
.status.offline { color: var(--error-color, #c62828); }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-top: 14px; }
.metric { border: 1px solid var(--divider-color); border-radius: 10px; padding: 10px; min-width: 0; }
.metric-label { color: var(--secondary-text-color); font-size: .78rem; }
.metric-value { font-size: 1.15rem; margin-top: 4px; overflow-wrap: anywhere; }
.section { margin-top: 14px; }
.section h3 { font-size: .9rem; margin: 0 0 8px; }
.items { display: flex; flex-wrap: wrap; gap: 6px; }
.chip { border: 1px solid var(--divider-color); border-radius: 999px; padding: 4px 8px; font-size: .8rem; }
.actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
button { background: var(--primary-color); border: 0; border-radius: 8px; color: var(--text-primary-color, white); cursor: pointer; padding: 8px 12px; }
button.dangerous { background: var(--error-color, #c62828); }
button.secondary { background: var(--secondary-background-color); color: var(--primary-text-color); }
button:focus-visible { outline: 2px solid var(--focus-color, var(--primary-color)); outline-offset: 2px; }
.danger-zone { border: 1px solid color-mix(in srgb, var(--error-color, #c62828) 55%, var(--divider-color)); border-radius: 10px; padding: 12px; }
.danger-zone h3 { color: var(--error-color, #c62828); }
.danger-zone p { color: var(--secondary-text-color); font-size: .82rem; margin: 0; }
.danger-zone .actions { margin-top: 10px; }
dialog { background: var(--ha-card-background, var(--card-background-color)); border: 1px solid var(--divider-color); border-radius: 12px; color: var(--primary-text-color); max-width: min(360px, calc(100vw - 32px)); }
dialog::backdrop { background: color-mix(in srgb, var(--primary-background-color) 55%, transparent); }
.dialog-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
`;
var PiManagerCard = class extends HTMLElement {
  _hass;
  _config = { type: "custom:pi-manager-card" };
  _root;
  constructor() {
    super();
    this._root = this.attachShadow({ mode: "open" });
  }
  setConfig(config) {
    this._config = { ...config };
    this._render();
  }
  set hass(value) {
    this._hass = value;
    this._render();
  }
  getCardSize() {
    return 5;
  }
  _state(key) {
    const entityId = this._config.entities?.[key];
    return entityId && this._hass ? this._hass.states[entityId] : void 0;
  }
  _display(key, fallback = "\u2014") {
    const state = this._state(key)?.state;
    return state && state !== "unknown" && state !== "unavailable" ? state : fallback;
  }
  _render() {
    if (!this._hass) return;
    const online = this._state("online")?.state === "on";
    const title = this._config.title ?? "Pi Manager";
    const reboot = this._state("reboot_required")?.state === "on";
    const updates = this._display("updates_available", "0");
    const machineState = this._state("cpu_usage");
    const machineAttributes = machineState?.attributes ?? {};
    const maintenanceConfigured = [
      "package_job_state",
      "package_audit",
      "held_packages",
      "failed_service_count"
    ].some((key) => Boolean(this._config.entities?.[key]));
    const maintenanceStatus = maintenanceConfigured ? `<section class="section"><h3>Package status</h3><div class="items"><span class="chip">Job: ${escapeHtml(this._display("package_job_state", "idle"))}</span><span class="chip">Audit: ${escapeHtml(this._display("package_audit", "Not checked"))}</span><span class="chip">Held: ${escapeHtml(this._display("held_packages", "0"))}</span><span class="chip">Failed services: ${escapeHtml(this._display("failed_service_count", "0"))}</span></div></section>` : "";
    const serviceRestartButtons = Object.entries(this._config.entities ?? {}).filter(([key]) => key.startsWith("restart_")).map(([key, entityId]) => this._button(key, `Restart ${key.slice("restart_".length).replaceAll("_", " ")}`, true, entityId)).join("");
    const dangerButtons = [
      this._button("preview_upgrade", "Preview normal upgrade", false),
      this._button("preview_dist_upgrade", "Preview dependency upgrade", false),
      this._button("preview_autoremove", "Preview unused dependencies", false),
      this._button("audit_packages", "Audit package database", false),
      this._button("show_package_holds", "Show held packages", false),
      this._button("failed_services", "Check failed services", false),
      this._button("install_updates", "Install normal updates", true),
      this._button("dist_upgrade", "Full dependency upgrade", true),
      this._button("configure_packages", "Finish package configuration", true),
      this._button("repair_packages", "Repair broken dependencies", true),
      this._button("autoremove", "Remove unused dependencies", true),
      this._button("autoclean", "Clean obsolete package cache", true),
      this._button("clean_cache", "Clear downloaded package cache", true),
      this._button("reboot", "Reboot", true),
      this._button("shutdown", "Shutdown", true),
      serviceRestartButtons
    ].join("");
    const filesystems = Object.entries(this._config.entities ?? {}).filter(([key]) => key.startsWith("filesystem_")).map(([, entityId]) => this._hass?.states[entityId]).filter((state) => Boolean(state));
    const services = Object.entries(this._config.entities ?? {}).filter(([key]) => key.startsWith("service_")).map(([, entityId]) => this._hass?.states[entityId]).filter((state) => Boolean(state));
    this._root.innerHTML = `<style>${STYLE}</style>
      <article class="card" aria-label="${escapeHtml(title)}">
        <div class="heading"><h2>${escapeHtml(title)}</h2><span class="status ${online ? "online" : "offline"}" aria-live="polite">${online ? "Online" : "Offline"}</span></div>
        <div class="grid">
          ${metric("CPU", this._display("cpu_usage"))}
          ${metric("Temperature", appendUnit(this._display("cpu_temperature"), "\xB0C"))}
          ${metric("Memory", appendUnit(this._display("memory_usage"), "%"))}
          ${metric("Load", this._display("load_1"))}
          ${metric("Uptime", this._display("uptime"))}
          ${metric("Updates", updates)}
          ${metric("Reboot", reboot ? "Required" : "Not required")}
        </div>
        <section class="section"><h3>Host</h3><div class="items"><span class="chip">${escapeHtml(machineAttributes.hostname?.toString() ?? "Unknown hostname")}</span><span class="chip">${escapeHtml(machineAttributes.os?.toString() ?? "Unknown OS")}</span><span class="chip">${escapeHtml(machineAttributes.architecture?.toString() ?? "Unknown architecture")}</span></div></section>
        <section class="section"><h3>Storage</h3><div class="items">${filesystems.length ? filesystems.map((state) => `<span class="chip">${escapeHtml(state.attributes.friendly_name?.toString() ?? state.entity_id)}: ${escapeHtml(state.state)}%</span>`).join("") : '<span class="status">No filesystem data</span>'}</div></section>
        <section class="section"><h3>Services</h3><div class="items">${services.length ? services.map((state) => `<span class="chip">${escapeHtml(state.attributes.friendly_name?.toString() ?? state.entity_id)}: ${state.state === "on" ? "running" : "stopped"}</span>`).join("") : '<span class="status">No monitored services</span>'}</div></section>
        ${maintenanceStatus}
        <section class="section"><h3>Quick actions</h3><div class="actions">
          ${this._button("refresh", "Refresh", false)}
          ${this._button("check_updates", "Check updates", false)}
        </div></section>
        ${dangerButtons ? `<section class="section danger-zone"><h3>Danger zone</h3><p>Each action applies to ${escapeHtml(title)} only. Package changes run in the background. Review previews before using a change action.</p><div class="actions">${dangerButtons}</div></section>` : ""}
        <dialog data-confirm-dialog><form method="dialog"><p data-confirm-message></p><div class="dialog-actions"><button class="secondary" value="cancel">Cancel</button><button value="confirm">Confirm</button></div></form></dialog>
      </article>`;
    this._root.querySelectorAll("button[data-action]").forEach((button) => {
      button.addEventListener("click", () => this._press(button.dataset.action ?? "", button.dataset.entity ?? ""));
    });
  }
  _button(action, label, dangerous, configuredEntity) {
    const entity = configuredEntity ?? this._config.entities?.[action];
    if (!entity || !this._hass?.states[entity]) return "";
    return `<button type="button" class="${dangerous ? "dangerous" : "secondary"}" data-action="${escapeHtml(action)}" data-entity="${escapeHtml(entity)}"${dangerous ? ' data-dangerous="true"' : ""}>${escapeHtml(label)}</button>`;
  }
  _press(action, entityId) {
    if (!this._hass || !entityId) return;
    const button = this._root.querySelector(`button[data-action="${CSS.escape(action)}"]`);
    if (button?.dataset.dangerous === "true") {
      const dialog = this._root.querySelector("dialog[data-confirm-dialog]");
      const message = this._root.querySelector("[data-confirm-message]");
      if (!dialog || !message) return;
      message.textContent = `Confirm ${action.replaceAll("_", " ")}?`;
      dialog.addEventListener("close", () => {
        if (dialog.returnValue === "confirm") void this._callButton(entityId);
      }, { once: true });
      dialog.showModal();
      return;
    }
    void this._callButton(entityId);
  }
  async _callButton(entityId) {
    if (!this._hass) return;
    const [domain, objectId] = entityId.split(".");
    if (!domain || !objectId) return;
    await this._hass.callService(domain, "press", { entity_id: entityId });
  }
};
function metric(label, value) {
  return `<div class="metric"><div class="metric-label">${escapeHtml(label)}</div><div class="metric-value">${escapeHtml(value)}</div></div>`;
}
function appendUnit(value, unit) {
  return value === "\u2014" ? value : `${value}${unit}`;
}
function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}

// src/types.ts
function isPiManagerDevice(device) {
  return (device.identifiers ?? []).some(([domain]) => domain === "pi_manager");
}
function entityMapForDevice(deviceId, entities) {
  const result = {};
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

// src/pi-manager-editor.ts
var PiManagerEditor = class extends HTMLElement {
  _hass;
  _config = { type: "custom:pi-manager-card" };
  _root;
  _devices = [];
  _entities = [];
  constructor() {
    super();
    this._root = this.attachShadow({ mode: "open" });
  }
  setConfig(config) {
    this._config = { ...config };
    this._render();
  }
  set hass(value) {
    this._hass = value;
    void this._loadDevices();
  }
  async _loadDevices() {
    if (!this._hass) return;
    const [devices, entities] = await Promise.all([
      this._hass.callWS({ type: "config/device_registry/list" }),
      this._hass.callWS({ type: "config/entity_registry/list" })
    ]);
    this._devices = devices.filter(isPiManagerDevice);
    this._entities = entities;
    this._render();
  }
  _render() {
    this._root.innerHTML = `<style>:host{display:block}.row{display:flex;flex-direction:column;gap:6px}label{font-weight:600}select{background:var(--card-background-color);border:1px solid var(--divider-color);border-radius:6px;color:var(--primary-text-color);padding:8px}</style><div class="row"><label for="device">Pi Manager device</label><select id="device"><option value="">Choose a device</option>${this._devices.map((device) => `<option value="${escapeHtml2(device.id)}"${device.id === this._config.device_id ? " selected" : ""}>${escapeHtml2(device.name ?? device.id)}</option>`).join("")}</select></div>`;
    this._root.querySelector("select")?.addEventListener("change", (event) => {
      const value = event.target.value;
      const entities = value ? entityMapForDevice(value, this._entities) : void 0;
      this.dispatchEvent(new CustomEvent("config-changed", {
        bubbles: true,
        composed: true,
        detail: { config: { ...this._config, device_id: value, ...entities ? { entities } : {} } }
      }));
    });
  }
};
function escapeHtml2(value) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}

// src/pi-manager-strategy.ts
var PiManagerDashboardStrategy = class extends HTMLElement {
  static getCreateSuggestions(_hass) {
    return { title: "Pi Manager", icon: "mdi:raspberry-pi" };
  }
  static getConfigElement() {
    return document.createElement("pi-manager-editor");
  }
  static configRequired = false;
  static async generate(config = {}, hass) {
    const [devices, entities] = await Promise.all([
      hass.callWS({ type: "config/device_registry/list" }),
      hass.callWS({ type: "config/entity_registry/list" })
    ]);
    const piDevices = devices.filter(isPiManagerDevice);
    const cards = [];
    for (const device of piDevices) {
      const map = entityMapForDevice(device.id, entities);
      cards.push({ type: "custom:pi-manager-card", title: device.name ?? "Pi Manager", device_id: device.id, entities: map });
    }
    const views = [
      {
        title: "Overview",
        path: "overview",
        icon: "mdi:view-dashboard",
        cards: piDevices.length ? [{ type: "grid", columns: 1, cards }] : [{ type: "markdown", content: "No Pi Manager hosts are configured yet." }]
      }
    ];
    for (const device of piDevices) {
      const map = entityMapForDevice(device.id, entities);
      views.push({
        title: device.name ?? "Pi Manager host",
        path: `pi-${slugPath(device.id)}`,
        icon: "mdi:raspberry-pi",
        cards: hostCards(device, map)
      });
    }
    return { title: config.title ?? "Pi Manager", views };
  }
};
function hostCards(device, map) {
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
        map.preview_autoremove
      ]
    ],
    ["Services", Object.entries(map).filter(([key]) => key.startsWith("service_")).map(([, entity]) => entity)]
  ];
  return [
    { type: "custom:pi-manager-card", title: device.name ?? "Pi Manager", device_id: device.id, entities: map },
    ...entityCards.filter(([, ids]) => ids.some(Boolean)).map(([title, ids]) => ({ type: "entities", title, entities: ids.filter(Boolean) }))
  ];
}
function slugPath(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "host";
}

// src/register.ts
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
    preview: true
  });
}
window.customStrategies = window.customStrategies ?? [];
if (!window.customStrategies.some((item) => item.type === "pi-manager")) {
  window.customStrategies.push({
    type: "pi-manager",
    strategyType: "dashboard",
    name: "Pi Manager",
    description: "Generate an overview and one view per managed Pi.",
    documentationURL: "https://developers.home-assistant.io/docs/frontend/custom-ui/custom-strategy/"
  });
}
export {
  PiManagerCard,
  PiManagerDashboardStrategy,
  PiManagerEditor
};
