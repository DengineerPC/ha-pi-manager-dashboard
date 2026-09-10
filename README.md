# Pi Manager Dashboard

Responsive Home Assistant custom card and dynamic dashboard strategy for the
Pi Manager integration.

![Pi Manager Dashboard](docs/pi-manager-dashboard.png)

Public HACS Dashboard repository:

<https://github.com/DengineerPC/ha-pi-manager-dashboard>

This package targets Home Assistant `2026.5.0` or newer and is optional. The
backend integration works independently with standard Home Assistant cards.

[Open Pi Manager Dashboard in HACS](https://my.home-assistant.io/redirect/hacs_repository/?owner=DengineerPC&repository=ha-pi-manager-dashboard&category=dashboard)

## Install through HACS

Until the repository is included in HACS's default catalog, add it as a custom
repository:

1. Open **HACS → Frontend/Dashboard**.
2. Open the HACS menu and choose **Custom repositories**.
3. Add `DengineerPC/ha-pi-manager-dashboard`.
4. Select **Dashboard** as the category.
5. Install **Pi Manager Dashboard**.
6. If HACS has not registered the resource automatically, open
   **Settings → Dashboards → Resources** and add the following as a
   **JavaScript module**:

   ```text
   /hacsfiles/ha-pi-manager-dashboard/ha-pi-manager-dashboard.js
   ```

7. Refresh Home Assistant and open the Community dashboards picker.
8. Select **Pi Manager**.

## What it provides

The package contains the built module
`dist/ha-pi-manager-dashboard.js`, the `pi-manager-card` custom card, and the
`pi-manager` public dashboard strategy. The strategy discovers devices and
entities belonging to the `pi_manager` integration through public Home
Assistant registry APIs. It generates one Overview and one view per managed
host without writing Lovelace storage or hard-coding entity IDs.

Each host view covers health, host identity, CPU, temperature, RAM, load,
uptime, storage, network, updates, monitored services, package-job state,
package audit/holds/failed-service summaries, previews, and maintenance. Each
host's actions stay inside that host's card. There is no fleet/all-host action,
and status indicators are rendered once in the shared dashboard.

The custom card places package-changing, service-restart, reboot, and shutdown
controls in a clearly labelled **Danger zone**. Home Assistant confirmation is
required for destructive actions, and the controls are omitted when that
host's integration options disable dangerous controls.

The module uses Home Assistant theme variables, handles offline and partial
data states, and is designed to wrap cleanly on desktop and mobile layouts.
It never edits `.storage/lovelace*` and does not require fixed entity IDs from a
developer installation.

## Docker Home Assistant

HACS installs the module under the Home Assistant configuration's managed
frontend directory. For a manual installation, copy the built file to
`/config/www/community/ha-pi-manager-dashboard/` in the host directory mounted
to the container's `/config/www/` path and use the `/local/community/...`
resource URL instead.

## Development validation

Run:

```text
npm ci
npm test -- --run
npm run lint
npm run typecheck
npm run build
```

The public release acceptance boundary is documented in the companion
integration repository. A successful local build does not by itself verify
HACS or an authenticated Home Assistant instance.
