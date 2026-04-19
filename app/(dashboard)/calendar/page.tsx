import Link from "next/link";
import Card from "@/components/ui/Card";
import NewOwnerBlockForm from "@/components/dashboard/NewOwnerBlockForm";
import { getReservations } from "@/services/reservations";
import { getOwnerBlocks } from "@/services/owner-blocks";
import { getPricingRules } from "@/services/pricing-rules";
import { deleteOwnerBlockAction } from "@/app/(dashboard)/actions";
import { formatCurrency, formatDate } from "@/lib/format";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type CalendarPageProps = {
  searchParams?: Promise<{
    month?: string;
  }>;
};

function makeUtcDate(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month, day));
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function toMonthParam(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function parseMonthParam(value?: string) {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) {
    const now = new Date();
    return {
      year: now.getUTCFullYear(),
      month: now.getUTCMonth(),
    };
  }

  const [yearString, monthString] = value.split("-");
  const year = Number(yearString);
  const monthIndex = Number(monthString) - 1;

  if (
    Number.isNaN(year) ||
    Number.isNaN(monthIndex) ||
    monthIndex < 0 ||
    monthIndex > 11
  ) {
    const now = new Date();
    return {
      year: now.getUTCFullYear(),
      month: now.getUTCMonth(),
    };
  }

  return { year, month: monthIndex };
}

function isStayDateInRange(day: string, start: string, end: string) {
  return day >= start && day < end;
}

function isRuleDateInRange(day: string, start: string, end: string) {
  return day >= start && day <= end;
}

function getPricingTier(rule: { name?: string | null; priority?: number | null } | null) {
  if (!rule) return null;

  const name = (rule.name || "").toLowerCase();
  const priority = rule.priority ?? 1;

  if (name.includes("eaa") || name.includes("event") || priority >= 10) {
    return "event";
  }

  if (priority >= 5) {
    return "premium";
  }

  return "standard";
}

function getPricingAccentClass(
  rule: { name?: string | null; priority?: number | null } | null,
) {
  const tier = getPricingTier(rule);

  if (tier === "event") return "border-l-rose-500";
  if (tier === "premium") return "border-l-violet-500";
  if (tier === "standard") return "border-l-sky-500";
  return "border-l-stone-200";
}

function getPricingBadgeClass(
  rule: { name?: string | null; priority?: number | null } | null,
) {
  const tier = getPricingTier(rule);

  if (tier === "event") return "bg-rose-100 text-rose-700";
  if (tier === "premium") return "bg-violet-100 text-violet-700";
  if (tier === "standard") return "bg-sky-100 text-sky-700";
  return "bg-stone-100 text-stone-600";
}

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const { year, month } = parseMonthParam(resolvedSearchParams.month);

  const [reservations, ownerBlocks, pricingRules] = await Promise.all([
    getReservations(),
    getOwnerBlocks(),
    getPricingRules(),
  ]);

  const sortedPricingRules = [...pricingRules].sort((a, b) => {
    const priorityDiff = (b.priority ?? 1) - (a.priority ?? 1);
    if (priorityDiff !== 0) return priorityDiff;

    return (
      new Date(a.start_date ?? "").getTime() - new Date(b.start_date ?? "").getTime()
    );
  });

  const today = new Date();
  const todayUtc = makeUtcDate(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  );

  const firstOfMonth = makeUtcDate(year, month, 1);
  const prevMonth = makeUtcDate(year, month - 1, 1);
  const nextMonth = makeUtcDate(year, month + 1, 1);

  const firstDayOfGrid = makeUtcDate(year, month, 1 - firstOfMonth.getUTCDay());

  const days = Array.from({ length: 42 }, (_, index) => {
    const date = makeUtcDate(
      firstDayOfGrid.getUTCFullYear(),
      firstDayOfGrid.getUTCMonth(),
      firstDayOfGrid.getUTCDate() + index,
    );

    const key = toDateKey(date);

    const ownerBlock = ownerBlocks.find((block) =>
      isStayDateInRange(key, block.start_date, block.end_date),
    );

    const reservation = reservations.find(
      (reservation) =>
        reservation.status !== "cancelled" &&
        isStayDateInRange(key, reservation.check_in, reservation.check_out),
    );

    const pricingRule =
      sortedPricingRules.find(
        (rule) =>
          !!rule.start_date &&
          !!rule.end_date &&
          isRuleDateInRange(key, rule.start_date, rule.end_date),
      ) ?? null;

    const isCurrentMonth = date.getUTCMonth() === month;
    const isToday = key === toDateKey(todayUtc);

    return {
      key,
      date,
      dayNumber: date.getUTCDate(),
      isCurrentMonth,
      isToday,
      ownerBlock,
      reservation,
      pricingRule,
    };
  });

  const monthLabel = firstOfMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="space-y-6">
      <NewOwnerBlockForm />

      <Card
        title={monthLabel}
        description="Occupancy and pricing view for the distillery flat"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3 text-sm text-stone-600">
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full bg-emerald-500" />
              Open
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full bg-blue-500" />
              Reservation
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full bg-amber-500" />
              Owner block
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full bg-sky-500" />
              Standard pricing
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full bg-violet-500" />
              Premium pricing
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full bg-rose-500" />
              Event pricing
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/calendar?month=${toMonthParam(prevMonth)}`}
              className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50"
            >
              ← Prev
            </Link>
            <Link
              href={`/calendar?month=${toMonthParam(todayUtc)}`}
              className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50"
            >
              Current
            </Link>
            <Link
              href={`/calendar?month=${toMonthParam(nextMonth)}`}
              className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50"
            >
              Next →
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {DAY_NAMES.map((day) => (
            <div
              key={day}
              className="rounded-lg px-2 py-1 text-center text-xs font-semibold uppercase tracking-wide text-stone-500"
            >
              {day}
            </div>
          ))}

          {days.map((day) => {
            const fillClass = day.ownerBlock
              ? "border-amber-200 bg-amber-50"
              : day.reservation
                ? "border-blue-200 bg-blue-50"
                : "border-stone-200 bg-white";

            return (
              <div
                key={day.key}
                className={[
                  "min-h-32 rounded-xl border border-l-4 p-2",
                  fillClass,
                  getPricingAccentClass(day.pricingRule),
                  !day.isCurrentMonth ? "opacity-40" : "",
                  day.isToday ? "ring-2 ring-stone-900" : "",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-stone-900">
                    {day.dayNumber}
                  </p>

                  {day.ownerBlock ? (
                    <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-medium text-white">
                      Blocked
                    </span>
                  ) : day.reservation ? (
                    <span className="rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-medium text-white">
                      Booked
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-medium text-white">
                      Open
                    </span>
                  )}
                </div>

                <div className="mt-2 space-y-1">
                  {day.pricingRule ? (
                    <>
                      <p
                        className={[
                          "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium",
                          getPricingBadgeClass(day.pricingRule),
                        ].join(" ")}
                      >
                        {day.pricingRule.name}
                      </p>

                      {day.pricingRule.nightly_rate ? (
                        <p className="text-xs font-medium text-stone-900">
                          {formatCurrency(day.pricingRule.nightly_rate)}/night
                        </p>
                      ) : null}

                      {day.pricingRule.min_stay ? (
                        <p className="text-xs text-stone-600">
                          {day.pricingRule.min_stay}-night minimum
                        </p>
                      ) : null}
                    </>
                  ) : (
                    <p className="text-xs text-stone-500">No pricing rule</p>
                  )}

                  {day.ownerBlock ? (
                    <>
                      <p className="pt-1 text-xs font-medium text-stone-900">
                        {day.ownerBlock.title}
                      </p>
                      {day.ownerBlock.reason ? (
                        <p className="text-xs text-stone-600">
                          {day.ownerBlock.reason}
                        </p>
                      ) : null}
                    </>
                  ) : day.reservation ? (
                    <>
                      <p className="pt-1 text-xs font-medium text-stone-900">
                        {day.reservation.guest_name}
                      </p>
                      <p className="text-xs text-stone-600">
                        {day.reservation.channel}
                      </p>
                    </>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card
        title="Owner Blocks"
        description="Dates reserved for owner use, maintenance, or unavailable periods"
      >
        <div className="space-y-3">
          {ownerBlocks.map((block) => (
            <div
              key={block.id}
              className="rounded-xl border border-stone-200 bg-white p-4"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-medium text-stone-900">{block.title}</p>
                  <p className="mt-1 text-sm text-stone-600">
                    {formatDate(block.start_date)} – {formatDate(block.end_date)}
                  </p>
                  {block.reason ? (
                    <p className="mt-1 text-sm text-stone-500">{block.reason}</p>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/owner-blocks/${block.id}/edit`}
                    className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50"
                  >
                    Edit
                  </Link>

                  <form action={deleteOwnerBlockAction}>
                    <input type="hidden" name="id" value={block.id} />
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
        </div>
      </Card>
    </div>
  );
}