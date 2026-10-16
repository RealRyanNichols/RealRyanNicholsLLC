# Deadman release on DigitalOcean

The production site runs behind Caddy on local port 3103. Vercel's cron configuration does not run jobs on this server. Install `run-deadman-cron.py` at `/usr/local/libexec/rrn-deadman-cron.py`, and the two files in `systemd/` under `/etc/systemd/system/`. Run `systemctl daemon-reload` and `systemctl enable --now rrn-deadman-release.timer`.

The worker uses the existing `DEADMAN_CRON_SECRET` or `CRON_SECRET` from `/srv/site-env/realryannichols.env`. No new credential or environment variable is needed. Credentials stay out of command arguments and logs. The hourly timer invokes the authenticated application route; all editorial gates, incident authorization, and atomic duplicate protection remain in place. While the switch is off, the route performs no release.

Check `systemctl list-timers rrn-deadman-release.timer` and `journalctl -u rrn-deadman@release.service`. A successful request while dormant reports `active: false` and `released: 0`. After activation, a same-hour request must not create a second bulletin. The database records every actual release.

The runner also accepts `social` for the existing social worker. This repair enables the hourly release timer only; platform publication still requires the site's existing credentials and dispatch configuration. A prepared caption is not a posted social update.
