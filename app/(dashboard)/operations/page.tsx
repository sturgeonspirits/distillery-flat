import Link from "next/link";
import Card from "@/components/ui/Card";
import {
  clearReservationMissingOnSourceAction,
  markReservationManualOverrideAction,
  saveTurnoverChecklistAction,
} from "../actions";
import {
  getOperationsSnapshot,
  type AttentionItem,
  type OperationsOwnerBlock,
  type OperationsReservation,
  type TurnoverItem,
} from "@/services/operations";

function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "green" | "yellow" | "red" | "blue";
}) {
  const toneClass =
    tone === "green"
      ? "bg-green-50 text-green-700 ring-green-200"
      : tone === "yellow"
        ? "bg-amber-50 text-amber-700 ring-amber-200"
        : tone === "red"
          ? "bg-red-50 text-red-700 ring-red-200"
          : tone === "blue"
            ? "bg-blue-50 text-blue-700 ring-blue-200"
            : "bg-zinc-50 text-zinc-700 ring-zinc-200";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ${toneClass}`}
    >
      {children}
    </span>
  );
}

function MetricCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <Card>
      <div className="p-4">
        <div className="text-sm text-zinc-500">{title}</div>
        <div className="mt-1 text-3xl font-semibold tracking-tight">{value}</div>
      </div>
    </Card>
  );
}

function reservationLabel(count: number, singular: string, plural?: string) {
  if (count === 1) return singular;
  return plural ?? `${singular}s`;
}

function turnoverStatusTone(status: TurnoverItem["checklist_status"]) {
  switch (status) {
    case "ready":
      return "green";
    case "in_progress":
      return "blue";
    case "issue":
      return "red";
    default:
      return "neutral";
  }
}

function turnoverStatusLabel(status: TurnoverItem["checklist_status"]) {
  return status.replace("_", " ");
}

function ReservationListCard({
  title,
  items,
  emptyMessage,
}: {
  title: string;
  items: OperationsReservation[];
  emptyMessage: string;
}) {
  return (
    <Card>
      <div className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Badge>{items.length}</Badge>
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-zinc-500">{emptyMessage}</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-zinc-200 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{item.guest_display_name}</div>
                    <div className="mt-1 text-sm text-zinc-600">
                      {item.arrival_date} → {item.departure_date}
                    </div>
                  </div>

                  <Link
                    href={`/reservations/${item.id}/edit`}
                    className="text-sm font-medium text-zinc-900 underline underline-offset-2"
                  >
                    Edit
                  </Link>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {item.channel || item.external_channel ? (
                    <Badge tone="blue">
                      {item.channel || item.external_channel}
                    </Badge>
                  ) : null}

                  {item.source ? <Badge>{item.source}</Badge> : null}

                  {item.reconciliation_status === "missing_on_source" ? (
                    <Badge tone="red">missing on source</Badge>
                  ) : item.reconciliation_status ? (
                    <Badge>{item.reconciliation_status}</Badge>
                  ) : null}

                  <Badge tone={item.has_usable_lock_code ? "green" : "yellow"}>
                    {item.has_usable_lock_code
                      ? "lock ready"
                      : "no usable lock code"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

function OwnerBlockListCard({
  title,
  items,
  emptyMessage,
}: {
  title: string;
  items: OperationsOwnerBlock[];
  emptyMessage: string;
}) {
  return (
    <Card>
      <div className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Badge>{items.length}</Badge>
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-zinc-500">{emptyMessage}</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-zinc-200 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{item.label}</div>
                    <div className="mt-1 text-sm text-zinc-600">
                      {item.block_start} → {item.block_end}
                    </div>
                  </div>

                  <Link
                    href={`/owner-blocks/${item.id}/edit`}
                    className="text-sm font-medium text-zinc-900 underline underline-offset-2"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

function TurnoverCard({ items }: { items: TurnoverItem[] }) {
  return (
    <Card>
      <div className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Turnover</h2>
          <Badge>{items.length}</Badge>
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No turnover tasks for today or tomorrow.
          </p>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <form
                key={item.id}
                action={saveTurnoverChecklistAction}
                className="rounded-xl border border-zinc-200 p-4"
              >
                <input type="hidden" name="turnoverDate" value={item.date_key} />

                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    tone={
                      item.priority === "high"
                        ? "red"
                        : item.priority === "medium"
                          ? "yellow"
                          : "neutral"
                    }
                  >
                    {item.priority}
                  </Badge>
                  <Badge>{item.date_label}</Badge>
                  <Badge tone={turnoverStatusTone(item.checklist_status)}>
                    {turnoverStatusLabel(item.checklist_status)}
                  </Badge>
                </div>

                <div className="mt-3 font-medium">{item.title}</div>
                <div className="mt-1 text-sm text-zinc-600">{item.detail}</div>
                <div className="mt-1 text-xs text-zinc-500">
                  {item.reservation_ids.length}{" "}
                  {reservationLabel(item.reservation_ids.length, "reservation")}
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <button
                    type="submit"
                    name="status"
                    value="not_started"
                    className="inline-flex items-center justify-center rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-900"
                  >
                    Reset
                  </button>
                  <button
                    type="submit"
                    name="status"
                    value="in_progress"
                    className="inline-flex items-center justify-center rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-900"
                  >
                    Mark in progress
                  </button>
                  <button
                    type="submit"
                    name="status"
                    value="ready"
                    className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white"
                  >
                    Mark ready
                  </button>
                  <button
                    type="submit"
                    name="status"
                    value="issue"
                    className="inline-flex items-center justify-center rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-700"
                  >
                    Flag issue
                  </button>
                </div>

                <div className="mt-4">
                  <label
                    htmlFor={`notes-${item.date_key}`}
                    className="block text-sm font-medium text-zinc-900"
                  >
                    Turnover notes
                  </label>
                  <textarea
                    id={`notes-${item.date_key}`}
                    name="notes"
                    defaultValue={item.checklist_notes ?? ""}
                    rows={3}
                    className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-0"
                    placeholder="Cleaning note, supply issue, damage note, or ready-for-check-in note"
                  />
                  <div className="mt-2">
                    <button
                      type="submit"
                      name="status"
                      value={item.checklist_status}
                      className="inline-flex items-center rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-900"
                    >
                      Save notes
                    </button>
                  </div>
                </div>
              </form>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

function AttentionCard({ items }: { items: AttentionItem[] }) {
  return (
    <Card>
      <div className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Attention needed</h2>
          <Badge tone={items.length ? "red" : "green"}>{items.length}</Badge>
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-zinc-500">Nothing urgent right now.</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-zinc-200 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge tone={item.level === "high" ? "red" : "yellow"}>
                        {item.level}
                      </Badge>
                      <span className="font-medium">{item.title}</span>
                    </div>

                    <div className="mt-2 text-sm text-zinc-600">
                      {item.detail}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link
                        href={item.href}
                        className="inline-flex items-center rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-900"
                      >
                        Review
                      </Link>

                      {item.kind === "missing_on_source" &&
                      item.reservation_id ? (
                        <>
                          <form action={markReservationManualOverrideAction}>
                            <input
                              type="hidden"
                              name="reservationId"
                              value={item.reservation_id}
                            />
                            <button
                              type="submit"
                              className="inline-flex items-center rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white"
                            >
                              Mark manual override
                            </button>
                          </form>

                          <form action={clearReservationMissingOnSourceAction}>
                            <input
                              type="hidden"
                              name="reservationId"
                              value={item.reservation_id}
                            />
                            <button
                              type="submit"
                              className="inline-flex items-center rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-900"
                            >
                              Clear flag
                            </button>
                          </form>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

export default async function OperationsPage() {
  const ops = await getOperationsSnapshot();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Operations</h1>
          <p className="mt-1 text-sm text-zinc-600">
            {ops.today_label} · live view for arrivals, departures, turnover,
            and exceptions
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/calendar"
            className="inline-flex items-center rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-900"
          >
            Calendar
          </Link>
          <Link
            href="/reservations"
            className="inline-flex items-center rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white"
          >
            Reservations
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard title="Arrivals today" value={ops.arrivals_today.length} />
        <MetricCard
          title="Departures today"
          value={ops.departures_today.length}
        />
        <MetricCard
          title="Occupied now"
          value={ops.currently_occupied.length}
        />
        <MetricCard
          title="Owner blocks today"
          value={ops.owner_blocks_today.length}
        />
        <MetricCard
          title="Arrivals tomorrow"
          value={ops.arrivals_tomorrow.length}
        />
        <MetricCard
          title="Departures tomorrow"
          value={ops.departures_tomorrow.length}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <TurnoverCard items={ops.turnover_items} />
        <AttentionCard items={ops.attention_items} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ReservationListCard
          title="Arrivals today"
          items={ops.arrivals_today}
          emptyMessage="No arrivals today."
        />
        <ReservationListCard
          title="Departures today"
          items={ops.departures_today}
          emptyMessage="No departures today."
        />
        <ReservationListCard
          title="Arrivals tomorrow"
          items={ops.arrivals_tomorrow}
          emptyMessage="No arrivals tomorrow."
        />
        <ReservationListCard
          title="Departures tomorrow"
          items={ops.departures_tomorrow}
          emptyMessage="No departures tomorrow."
        />
        <ReservationListCard
          title="Currently occupied"
          items={ops.currently_occupied}
          emptyMessage="Unit is not currently occupied."
        />
        <OwnerBlockListCard
          title="Owner blocks today / tomorrow"
          items={[
            ...ops.owner_blocks_today,
            ...ops.owner_blocks_tomorrow.filter(
              (tomorrowBlock) =>
                !ops.owner_blocks_today.some(
                  (todayBlock) => todayBlock.id === tomorrowBlock.id,
                ),
            ),
          ]}
          emptyMessage="No owner blocks affecting today or tomorrow."
        />
      </div>
    </div>
  );
}