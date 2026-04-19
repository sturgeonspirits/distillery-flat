import Card from "@/components/ui/Card";
import CopyButton from "@/components/ui/CopyButton";
import NewIcalSourceForm from "@/components/dashboard/NewIcalSourceForm";
import NewSmartLockForm from "@/components/dashboard/NewSmartLockForm";
import {
  deleteIcalSourceAction,
  deleteSmartLockAction,
  syncAllIcalSourcesAction,
  syncIcalSourceAction,
} from "@/app/(dashboard)/actions";
import { getIcalSources } from "@/services/ical-sources";
import { getRecentIcalSyncRuns } from "@/services/ical-sync-runs";
import { getSmartLocks } from "@/services/locks";

const UNIT_ID = "cdd0a039-ef0a-44b5-a68d-339866029d42";

function formatDateTime(value: string | null) {
  if (!value) return "Never";

  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function SettingsPage() {
  const [icalSources, recentRuns, smartLocks] = await Promise.all([
    getIcalSources(UNIT_ID),
    getRecentIcalSyncRuns(UNIT_ID, 20),
    getSmartLocks(UNIT_ID),
  ]);

  const baseUrl =
    process.env.SYNC_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";

  const staffToken = process.env.STAFF_ICAL_TOKEN || "";
  const staffCalendarUrl =
    staffToken && baseUrl
      ? `${baseUrl.replace(/\/$/, "")}/api/staff-calendar?token=${staffToken}`
      : "";

  return (
    <div className="space-y-6">
      <Card
        title="Staff Rental Calendar Feed"
        description="Subscribe in Google Calendar so staff can see reservations and owner blocks"
      >
        {staffCalendarUrl ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
              <p className="mb-2 text-sm font-medium text-stone-900">
                Subscription URL
              </p>

              <div className="flex flex-col gap-2 md:flex-row">
                <input
                  readOnly
                  value={staffCalendarUrl}
                  className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700"
                />
                <CopyButton value={staffCalendarUrl} />
              </div>
            </div>

            <div className="rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-700">
              <p className="font-medium text-stone-900">Google Calendar</p>
              <p className="mt-1">
                In Google Calendar on desktop: Other calendars → From URL →
                paste this link.
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Missing <code>STAFF_ICAL_TOKEN</code> or base URL. Set{" "}
            <code>STAFF_ICAL_TOKEN</code> and <code>SYNC_BASE_URL</code> in your
            environment to generate the subscription link here.
          </div>
        )}
      </Card>

      <NewSmartLockForm />

      <Card
        title="Smart Locks"
        description="Active locks on this unit that can receive pending access codes"
      >
        <div className="space-y-3">
          {smartLocks.map((lock) => (
            <div
              key={lock.id}
              className="rounded-xl border border-stone-200 bg-white p-4"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                  <p className="font-medium text-stone-900">{lock.name}</p>
                  <p className="text-sm text-stone-600">
                    Provider: {lock.provider}
                  </p>
                  <p className="text-xs text-stone-500">
                    External ID: {lock.external_lock_id || "Not set"}
                  </p>
                  <p className="text-xs text-stone-500">
                    Status: {lock.is_active ? "Active" : "Inactive"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <form action={deleteSmartLockAction}>
                    <input type="hidden" name="id" value={lock.id} />
                    <button
                      type="submit"
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}

          {smartLocks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-stone-300 px-4 py-8 text-center text-sm text-stone-500">
              No smart locks saved yet.
            </div>
          ) : null}
        </div>
      </Card>

      <NewIcalSourceForm />

      <Card
        title="Saved iCal Sources"
        description="Named feed URLs for one-click sync into reservations"
      >
        <div className="mb-4">
          <form action={syncAllIcalSourcesAction}>
            <button
              type="submit"
              className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50"
            >
              Sync All Active Sources
            </button>
          </form>
        </div>

        <div className="space-y-3">
          {icalSources.map((source) => (
            <div
              key={source.id}
              className="rounded-xl border border-stone-200 bg-white p-4"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                  <p className="font-medium text-stone-900">
                    {source.source_name}
                  </p>
                  <p className="break-all text-sm text-stone-600">
                    {source.feed_url}
                  </p>
                  <p className="text-xs text-stone-500">
                    Last synced: {formatDateTime(source.last_synced_at)}
                  </p>
                  <p className="text-xs text-stone-500">
                    Status: {source.last_sync_status ?? "Never run"}
                  </p>
                  {source.last_error ? (
                    <p className="text-xs text-red-600">
                      Last error: {source.last_error}
                    </p>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  <form action={syncIcalSourceAction}>
                    <input type="hidden" name="id" value={source.id} />
                    <button
                      type="submit"
                      className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50"
                    >
                      Sync
                    </button>
                  </form>

                  <form action={deleteIcalSourceAction}>
                    <input type="hidden" name="id" value={source.id} />
                    <button
                      type="submit"
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}

          {icalSources.length === 0 ? (
            <div className="rounded-xl border border-dashed border-stone-300 px-4 py-8 text-center text-sm text-stone-500">
              No iCal sources saved yet.
            </div>
          ) : null}
        </div>
      </Card>

      <Card
        title="Recent iCal Sync Runs"
        description="Background and manual sync monitoring"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-200 text-sm">
            <thead>
              <tr className="text-left text-stone-500">
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Trigger</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Started</th>
                <th className="px-4 py-3 font-medium">Finished</th>
                <th className="px-4 py-3 font-medium">Counts</th>
                <th className="px-4 py-3 font-medium">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {recentRuns.map((run) => (
                <tr key={run.id} className="align-top">
                  <td className="px-4 py-4 text-stone-900">{run.source_name}</td>
                  <td className="px-4 py-4 text-stone-700">{run.trigger}</td>
                  <td className="px-4 py-4 text-stone-700">{run.status}</td>
                  <td className="px-4 py-4 text-stone-700">
                    {formatDateTime(run.started_at)}
                  </td>
                  <td className="px-4 py-4 text-stone-700">
                    {formatDateTime(run.finished_at)}
                  </td>
                  <td className="px-4 py-4 text-stone-700">
                    {run.synced} synced / {run.skipped} skipped /{" "}
                    {run.total_events} total
                  </td>
                  <td className="px-4 py-4 text-red-600">
                    {run.error_message ?? "—"}
                  </td>
                </tr>
              ))}

              {recentRuns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-stone-500">
                    No sync runs yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}