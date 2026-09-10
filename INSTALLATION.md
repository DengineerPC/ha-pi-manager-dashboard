# Pi Manager Dashboard Installation

This guide covers the public `0.2.1` HACS Dashboard release for Home
Assistant `2026.5.0` or newer. Install the companion Pi Manager Integration
first and configure at least one host.

## HACS installation

1. Open **HACS → Frontend/Dashboard**.
2. Open the HACS menu and choose **Custom repositories**.
3. Add `DengineerPC/ha-pi-manager-dashboard`.
4. Choose **Dashboard** as the repository category.
5. Install **Pi Manager Dashboard**.
6. If HACS does not register the resource automatically, open
   **Settings → Dashboards → Resources** and add this URL with type
   **JavaScript module**:

   ```text
   /hacsfiles/ha-pi-manager-dashboard/ha-pi-manager-dashboard.js
   ```

7. Refresh Home Assistant and open the Community dashboards picker.
8. Select **Pi Manager**.

The strategy discovers all configured `pi_manager` devices and creates one
Overview plus one host view per device. Adding or removing a host is reflected
when the strategy regenerates; no entity IDs need to be copied into YAML.

## Home Assistant Container on Docker/OMV

HACS manages the resource path inside the Home Assistant configuration. For a
manual fallback, copy `dist/ha-pi-manager-dashboard.js` into the host directory
mounted to `/config/www/community/ha-pi-manager-dashboard/`, add the resource
using:

```text
/local/community/ha-pi-manager-dashboard/ha-pi-manager-dashboard.js
```

with type **JavaScript module**, then restart/refresh Home Assistant. Do not
copy the file only into the container's ephemeral filesystem.

## Behaviour and safety

The generated dashboard renders each host's status once and keeps actions in
that host's card. There is no fleet action. Package maintenance, service
restart, reboot, and shutdown controls appear only when that host's integration
options enable dangerous controls and require Home Assistant confirmation.

If the resource returns `404`, check that the selected HACS repository is the
Dashboard category and that the `/hacsfiles/` path is used for HACS rather than
the `/local/community/` path used for manual installation. Hard-refresh the
browser after replacing the module.
