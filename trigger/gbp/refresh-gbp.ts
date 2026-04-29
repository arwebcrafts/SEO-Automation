import { task } from "@trigger.dev/sdk";

/**
 * Refresh stale GbpSnapshot rows via the app cron route (configure schedule in Trigger.dev UI).
 */
export const refreshGbpSnapshotsTask = task({
  id: "refresh-gbp-snapshots",
  run: async () => {
    const base =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
      "http://localhost:3000";
    const secret = process.env.CRON_SECRET;
    const res = await fetch(`${base.replace(/\/$/, "")}/api/cron/gbp-refresh`, {
      headers: secret ? { Authorization: `Bearer ${secret}` } : {},
    });
    const body = await res.json().catch(() => ({}));
    return { status: res.status, body };
  },
});
