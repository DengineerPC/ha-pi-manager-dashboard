import { Hass, HassEntity, PiManagerCardConfig } from "./types";

const STYLE = `
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

export class PiManagerCard extends HTMLElement {
  private _hass?: Hass;
  private _config: PiManagerCardConfig = { type: "custom:pi-manager-card" };
  private _root: ShadowRoot;

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
    this._render();
  }

  getCardSize(): number {
    return 5;
  }

  private _state(key: string): HassEntity | undefined {
    const entityId = this._config.entities?.[key];
    return entityId && this._hass ? this._hass.states[entityId] : undefined;
  }

  private _display(key: string, fallback = "—"): string {
    const state = this._state(key)?.state;
    return state && state !== "unknown" && state !== "unavailable" ? state : fallback;
  }

  private _render(): void {
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
      "failed_service_count",
    ].some((key) => Boolean(this._config.entities?.[key]));
    const maintenanceStatus = maintenanceConfigured
      ? `<section class="section"><h3>Package status</h3><div class="items"><span class="chip">Job: ${escapeHtml(this._display("package_job_state", "idle"))}</span><span class="chip">Audit: ${escapeHtml(this._display("package_audit", "Not checked"))}</span><span class="chip">Held: ${escapeHtml(this._display("held_packages", "0"))}</span><span class="chip">Failed services: ${escapeHtml(this._display("failed_service_count", "0"))}</span></div></section>`
      : "";
    const serviceRestartButtons = Object.entries(this._config.entities ?? {})
      .filter(([key]) => key.startsWith("restart_"))
      .map(([key, entityId]) => this._button(key, `Restart ${key.slice("restart_".length).replaceAll("_", " ")}`, true, entityId))
      .join("");
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
      serviceRestartButtons,
    ].join("");
    const filesystems = Object.entries(this._config.entities ?? {})
      .filter(([key]) => key.startsWith("filesystem_"))
      .map(([, entityId]) => this._hass?.states[entityId])
      .filter((state): state is HassEntity => Boolean(state));
    const services = Object.entries(this._config.entities ?? {})
      .filter(([key]) => key.startsWith("service_"))
      .map(([, entityId]) => this._hass?.states[entityId])
      .filter((state): state is HassEntity => Boolean(state));
    this._root.innerHTML = `<style>${STYLE}</style>
      <article class="card" aria-label="${escapeHtml(title)}">
        <div class="heading"><h2>${escapeHtml(title)}</h2><span class="status ${online ? "online" : "offline"}" aria-live="polite">${online ? "Online" : "Offline"}</span></div>
        <div class="grid">
          ${metric("CPU", this._display("cpu_usage"))}
          ${metric("Temperature", appendUnit(this._display("cpu_temperature"), "°C"))}
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
    this._root.querySelectorAll<HTMLButtonElement>("button[data-action]").forEach((button) => {
      button.addEventListener("click", () => this._press(button.dataset.action ?? "", button.dataset.entity ?? ""));
    });
  }

  private _button(action: string, label: string, dangerous: boolean, configuredEntity?: string): string {
    const entity = configuredEntity ?? this._config.entities?.[action];
    if (!entity || !this._hass?.states[entity]) return "";
    return `<button type="button" class="${dangerous ? "dangerous" : "secondary"}" data-action="${escapeHtml(action)}" data-entity="${escapeHtml(entity)}"${dangerous ? ' data-dangerous="true"' : ""}>${escapeHtml(label)}</button>`;
  }

  private _press(action: string, entityId: string): void {
    if (!this._hass || !entityId) return;
    const button = this._root.querySelector<HTMLButtonElement>(`button[data-action="${CSS.escape(action)}"]`);
    if (button?.dataset.dangerous === "true") {
      const dialog = this._root.querySelector<HTMLDialogElement>("dialog[data-confirm-dialog]");
      const message = this._root.querySelector<HTMLElement>("[data-confirm-message]");
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

  private async _callButton(entityId: string): Promise<void> {
    if (!this._hass) return;
    const [domain, objectId] = entityId.split(".");
    if (!domain || !objectId) return;
    await this._hass.callService(domain, "press", { entity_id: entityId });
  }
}

function metric(label: string, value: string): string {
  return `<div class="metric"><div class="metric-label">${escapeHtml(label)}</div><div class="metric-value">${escapeHtml(value)}</div></div>`;
}

function appendUnit(value: string, unit: string): string {
  return value === "—" ? value : `${value}${unit}`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}
