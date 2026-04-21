import Card from "@/components/ui/Card";
import CopyButton from "@/components/ui/CopyButton";
import NewGuestPortalSectionForm from "@/components/dashboard/NewGuestPortalSectionForm";
import {
  createGuestPortalSessionAction,
  revokeGuestPortalSessionAction,
  deleteGuestPortalContentAction,
  resolveGuestPortalMessageRequestAction,
} from "@/app/(dashboard)/actions";
import { formatDate } from "@/lib/format";
import { getReservations } from "@/services/reservations";
import {
  buildGuestPortalUrl,
  getGuestPortalContent,
  getGuestPortalMessageRequests,
  getGuestPortalSessions,
} from "@/services/guest-portal";

function formatDateTime(value: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function isSessionActive(session: {
  revoked_at: string | null;
  expires_at: string | null;
}) {
  if (session.revoked_at) return false;
  if (session.expires_at && new Date(session.expires_at) < new Date()) return false;
  return true;
}

export default async function GuestPortalDashboardPage() {
  const [reservations, sessions, sections, messageRequests] = await Promise.all([
    getReservations(),
    getGuestPortalSessions(),
    getGuestPortalContent(),
    getGuestPortalMessageRequests(),
  ]);

  const activeSessionByReservationId = new Map<
    string,
    (typeof sessions)[number]
  >();

  for (const session of sessions) {
    if (!isSessionActive(session)) continue;

    if (!activeSessionByReservationId.has(session.reservation_id)) {
      activeSessionByReservationId.set(session.reservation_id, session);
    }
  }

  const openRequests = messageRequests.filter((request) => request.status === "new");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Guest Portal</h1>
          <p className="mt-1 text-sm text-stone-600">
            Reservation-linked portal pages for stay information, access, and
            guest questions.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Active portal links">
          <p className="text-3xl font-semibold text-stone-900">
            {activeSessionByReservationId.size}
          </p>
          <p className="mt-1 text-sm text-stone-600">
            One shareable guest link per active reservation when needed.
          </p>
        </Card>

        <Card title="Portal content sections">
          <p className="text-3xl font-semibold text-stone-900">
            {sections.filter((section) => section.is_active).length}
          </p>
          <p className="mt-1 text-sm text-stone-600">
            Global sections guests will see inside the portal.
          </p>
        </Card>

        <Card title="Open guest questions">
          <p className="text-3xl font-semibold text-stone-900">
            {openRequests.length}
          </p>
          <p className="mt-1 text-sm text-stone-600">
            New requests submitted from the public guest portal.
          </p>
        </Card>
      </div>

      <Card
        title="Portal Content"
        description="These sections appear in every active guest portal. Save a new key to create a section, or reuse a key later to update one."
      >
        <NewGuestPortalSectionForm />

        <div className="mt-6 space-y-4">
          {sections.map((section) => (
            <div
              key={section.id}
              className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                    {section.section_key}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-stone-900">
                    {section.title}
                  </h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-stone-700">
                    {section.body}
                  </p>
                  <p className="mt-3 text-xs text-stone-500">
                    Sort order: {section.sort_order} ·{" "}
                    {section.is_active ? "Active" : "Inactive"}
                  </p>
                </div>

                <form action={deleteGuestPortalContentAction}>
                  <input type="hidden" name="id" value={section.id} />
                  <button
                    type="submit"
                    className="text-sm font-medium text-red-600 underline"
                  >
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ))}

          {sections.length === 0 ? (
            <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-6 text-sm text-stone-600">
              No guest portal sections yet. Add your first welcome or arrival
              section above.
            </div>
          ) : null}
        </div>
      </Card>

      <Card
        title="Guest Questions"
        description="Messages submitted from the public guest portal. This is the first step toward a future reservation-linked communications workspace."
      >
        <div className="space-y-4">
          {messageRequests.map((request) => (
            <div
              key={request.id}
              className="rounded-2xl border border-stone-200 bg-white p-4"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-semibold text-stone-900">
                      {request.guest_name}
                    </p>
                    <p className="text-xs text-stone-500">
                      {formatDateTime(request.created_at)}
                    </p>
                  </div>

                  <p className="whitespace-pre-wrap text-sm text-stone-700">
                    {request.message}
                  </p>

                  <p className="text-xs text-stone-500">
                    Email: {request.guest_email || "—"} · Phone:{" "}
                    {request.guest_phone || "—"}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      request.status === "resolved"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {request.status === "resolved" ? "Resolved" : "New"}
                  </span>

                  {request.status !== "resolved" ? (
                    <form action={resolveGuestPortalMessageRequestAction}>
                      <input type="hidden" name="id" value={request.id} />
                      <button
                        type="submit"
                        className="text-sm font-medium text-stone-700 underline"
                      >
                        Mark resolved
                      </button>
                    </form>
                  ) : null}
                </div>
              </div>
            </div>
          ))}

          {messageRequests.length === 0 ? (
            <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-6 text-sm text-stone-600">
              No guest portal messages yet.
            </div>
          ) : null}
        </div>
      </Card>

      <Card
        title="Portal Links by Reservation"
        description="Create and manage the public guest-facing portal link for each stay."
      >
        {reservations.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-6 text-sm text-stone-600">
            No reservations yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200 text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-stone-500">
                  <th className="px-3 py-2">Guest</th>
                  <th className="px-3 py-2">Dates</th>
                  <th className="px-3 py-2">Channel</th>
                  <th className="px-3 py-2">Portal Link</th>
                  <th className="px-3 py-2">Last Access</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-stone-100">
                {reservations.map((reservation) => {
                  const session = activeSessionByReservationId.get(reservation.id);
                  const portalUrl = session
                    ? buildGuestPortalUrl(session.access_token)
                    : null;

                  return (
                    <tr key={reservation.id} className="align-top">
                      <td className="px-3 py-3">
                        <div className="font-medium text-stone-900">
                          {reservation.guest_name}
                        </div>
                        <div className="text-stone-500">
                          {reservation.status}
                        </div>
                      </td>

                      <td className="px-3 py-3 text-stone-700">
                        {formatDate(reservation.check_in)} –{" "}
                        {formatDate(reservation.check_out)}
                      </td>

                      <td className="px-3 py-3 text-stone-700">
                        {reservation.channel}
                      </td>

                      <td className="px-3 py-3">
                        {portalUrl ? (
                          <div className="space-y-2">
                            <a
                              href={portalUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="block break-all text-sm text-stone-700 underline"
                            >
                              {portalUrl}
                            </a>
                            <CopyButton value={portalUrl} />
                          </div>
                        ) : (
                          <span className="text-stone-500">No active link</span>
                        )}
                      </td>

                      <td className="px-3 py-3 text-stone-700">
                        {session ? formatDateTime(session.last_accessed_at) : "—"}
                      </td>

                      <td className="px-3 py-3">
                        <div className="flex flex-col items-start gap-2">
                          <form action={createGuestPortalSessionAction}>
                            <input
                              type="hidden"
                              name="reservation_id"
                              value={reservation.id}
                            />
                            <button
                              type="submit"
                              className="text-sm font-medium text-stone-700 underline"
                            >
                              {session ? "Regenerate link" : "Create link"}
                            </button>
                          </form>

                          {session ? (
                            <form action={revokeGuestPortalSessionAction}>
                              <input type="hidden" name="id" value={session.id} />
                              <button
                                type="submit"
                                className="text-sm font-medium text-red-600 underline"
                              >
                                Revoke link
                              </button>
                            </form>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
