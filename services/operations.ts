import { getOwnerBlocks } from "@/services/owner-blocks";
import { getReservations } from "@/services/reservations";
import { getTurnoverChecklistsForDates } from "@/services/turnovers";
import type { TurnoverStatus } from "@/types/turnover";

const PROPERTY_TIME_ZONE = process.env.PROPERTY_TIME_ZONE || "America/Chicago";
const UNIT_ID = "cdd0a039-ef0a-44b5-a68d-339866029d42";

type LockAccessCodeLike = {
  status?: string | null;
  code?: string | null;
};

type ReservationLike = {
  id: string;
  guest_name?: string | null;
  guestName?: string | null;
  check_in?: string | null;
  check_out?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  status?: string | null;
  channel?: string | null;
  source?: string | null;
  external_channel?: string | null;
  reconciliation_status?: string | null;
  lock_access_codes?: LockAccessCodeLike[] | null;
};

type OwnerBlockLike = {
  id: string;
  title?: string | null;
  reason?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  status?: string | null;
};

export type OperationsReservation = ReservationLike & {
  arrival_date: string;
  departure_date: string;
  guest_display_name: string;
  has_usable_lock_code: boolean;
};

export type OperationsOwnerBlock = OwnerBlockLike & {
  block_start: string;
  block_end: string;
  label: string;
};

export type TurnoverItem = {
  id: string;
  date_key: string;
  date_label: string;
  priority: "high" | "medium" | "low";
  kind: "same_day_turnover" | "checkout_clean" | "arrival_prep";
  title: string;
  detail: string;
  reservation_ids: string[];
  checklist_status: TurnoverStatus;
  checklist_notes: string | null;
};

export type AttentionItem = {
  id: string;
  level: "high" | "medium";
  kind: "missing_on_source" | "missing_lock_code" | "turnover_issue";
  title: string;
  detail: string;
  href: string;
  reservation_id?: string;
};

export type OperationsSnapshot = {
  today_key: string;
  tomorrow_key: string;
  today_label: string;
  tomorrow_label: string;

  arrivals_today: OperationsReservation[];
  arrivals_tomorrow: OperationsReservation[];
  departures_today: OperationsReservation[];
  departures_tomorrow: OperationsReservation[];
  currently_occupied: OperationsReservation[];

  owner_blocks_today: OperationsOwnerBlock[];
  owner_blocks_tomorrow: OperationsOwnerBlock[];

  turnover_items: TurnoverItem[];
  attention_items: AttentionItem[];
};

function addDays(base: Date, days: number) {
  return new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
}

function getDateParts(date: Date, timeZone = PROPERTY_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((p) => p.type === "year")?.value ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const day = parts.find((p) => p.type === "day")?.value ?? "";

  return { year, month, day };
}

function toDateKey(date: Date, timeZone = PROPERTY_TIME_ZONE) {
  const { year, month, day } = getDateParts(date, timeZone);
  return `${year}-${month}-${day}`;
}

function toFriendlyDate(date: Date, timeZone = PROPERTY_TIME_ZONE) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

function normalizeDate(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

function getArrivalDate(reservation: ReservationLike) {
  return normalizeDate(reservation.check_in ?? reservation.start_date);
}

function getDepartureDate(reservation: ReservationLike) {
  return normalizeDate(reservation.check_out ?? reservation.end_date);
}

function getBlockStart(block: OwnerBlockLike) {
  return normalizeDate(block.start_date);
}

function getBlockEnd(block: OwnerBlockLike) {
  return normalizeDate(block.end_date);
}

function isOperationalReservation(status?: string | null) {
  const value = (status ?? "").toLowerCase();
  return value !== "cancelled" && value !== "deleted";
}

function overlapsOccupiedOnDate(
  reservation: OperationsReservation,
  dateKey: string,
) {
  return reservation.arrival_date < dateKey && reservation.departure_date > dateKey;
}

function blockTouchesDate(block: OperationsOwnerBlock, dateKey: string) {
  return block.block_start <= dateKey && block.block_end >= dateKey;
}

function hasUsableLockCode(codes?: LockAccessCodeLike[] | null) {
  return (codes ?? []).some((code) =>
    ["pending", "active", "created"].includes((code.status ?? "").toLowerCase()),
  );
}

function buildBaseTurnoverItemsForDate(args: {
  dateKey: string;
  dateLabel: string;
  arrivals: OperationsReservation[];
  departures: OperationsReservation[];
}) {
  const { dateKey, dateLabel, arrivals, departures } = args;
  const items: Omit<TurnoverItem, "checklist_status" | "checklist_notes">[] = [];

  const arrival = arrivals[0];
  const departure = departures[0];

  if (arrival && departure) {
    items.push({
      id: `turnover-${dateKey}`,
      date_key: dateKey,
      date_label: dateLabel,
      priority: "high",
      kind: "same_day_turnover",
      title: `Same-day turnover ${dateLabel}`,
      detail: `${departure.guest_display_name} departs, ${arrival.guest_display_name} arrives`,
      reservation_ids: [departure.id, arrival.id],
    });
    return items;
  }

  if (departure) {
    items.push({
      id: `checkout-clean-${dateKey}`,
      date_key: dateKey,
      date_label: dateLabel,
      priority: "medium",
      kind: "checkout_clean",
      title: `Checkout clean ${dateLabel}`,
      detail: `${departure.guest_display_name} departs`,
      reservation_ids: [departure.id],
    });
  }

  if (arrival) {
    items.push({
      id: `arrival-prep-${dateKey}`,
      date_key: dateKey,
      date_label: dateLabel,
      priority: departure ? "medium" : "low",
      kind: "arrival_prep",
      title: `Arrival prep ${dateLabel}`,
      detail: `${arrival.guest_display_name} arrives`,
      reservation_ids: [arrival.id],
    });
  }

  return items;
}

function normalizeReservation(
  reservation: ReservationLike,
): OperationsReservation | null {
  const arrival = getArrivalDate(reservation);
  const departure = getDepartureDate(reservation);

  if (!arrival || !departure) return null;

  return {
    ...reservation,
    arrival_date: arrival,
    departure_date: departure,
    guest_display_name:
      reservation.guest_name?.trim() ||
      reservation.guestName?.trim() ||
      "Unnamed guest",
    has_usable_lock_code: hasUsableLockCode(reservation.lock_access_codes),
  };
}

function normalizeOwnerBlock(block: OwnerBlockLike): OperationsOwnerBlock | null {
  const start = getBlockStart(block);
  const end = getBlockEnd(block);

  if (!start || !end) return null;

  return {
    ...block,
    block_start: start,
    block_end: end,
    label: block.title?.trim() || block.reason?.trim() || "Owner block",
  };
}

export async function getOperationsSnapshot(
  referenceDate = new Date(),
): Promise<OperationsSnapshot> {
  const todayKey = toDateKey(referenceDate);
  const tomorrowDate = addDays(referenceDate, 1);
  const tomorrowKey = toDateKey(tomorrowDate);

  const [rawReservations, rawOwnerBlocks] = await Promise.all([
    Promise.resolve(getReservations() as unknown as ReservationLike[]),
    Promise.resolve(getOwnerBlocks() as unknown as OwnerBlockLike[]),
  ]);

  const activeReservations = rawReservations
    .map(normalizeReservation)
    .filter((value): value is OperationsReservation => Boolean(value))
    .filter((reservation) => isOperationalReservation(reservation.status));

  const ownerBlocks = rawOwnerBlocks
    .map(normalizeOwnerBlock)
    .filter((value): value is OperationsOwnerBlock => Boolean(value));

  const arrivalsToday = activeReservations.filter(
    (reservation) => reservation.arrival_date === todayKey,
  );
  const arrivalsTomorrow = activeReservations.filter(
    (reservation) => reservation.arrival_date === tomorrowKey,
  );

  const departuresToday = activeReservations.filter(
    (reservation) => reservation.departure_date === todayKey,
  );
  const departuresTomorrow = activeReservations.filter(
    (reservation) => reservation.departure_date === tomorrowKey,
  );

  const currentlyOccupied = activeReservations.filter((reservation) =>
    overlapsOccupiedOnDate(reservation, todayKey),
  );

  const ownerBlocksToday = ownerBlocks.filter((block) =>
    blockTouchesDate(block, todayKey),
  );
  const ownerBlocksTomorrow = ownerBlocks.filter((block) =>
    blockTouchesDate(block, tomorrowKey),
  );

  const baseTurnoverItems = [
    ...buildBaseTurnoverItemsForDate({
      dateKey: todayKey,
      dateLabel: "today",
      arrivals: arrivalsToday,
      departures: departuresToday,
    }),
    ...buildBaseTurnoverItemsForDate({
      dateKey: tomorrowKey,
      dateLabel: "tomorrow",
      arrivals: arrivalsTomorrow,
      departures: departuresTomorrow,
    }),
  ];

  const turnoverChecklists = await getTurnoverChecklistsForDates({
    unit_id: UNIT_ID,
    dates: baseTurnoverItems.map((item) => item.date_key),
  });

  const checklistByDate = new Map(
    turnoverChecklists.map((item) => [item.turnover_date, item]),
  );

  const turnoverItems: TurnoverItem[] = baseTurnoverItems.map((item) => {
    const checklist = checklistByDate.get(item.date_key);

    return {
      ...item,
      checklist_status: checklist?.status ?? "not_started",
      checklist_notes: checklist?.notes ?? null,
    };
  });

  const attentionItems: AttentionItem[] = [];

  for (const reservation of activeReservations) {
    const touchesOpsWindow =
      reservation.arrival_date === todayKey ||
      reservation.arrival_date === tomorrowKey ||
      reservation.departure_date === todayKey ||
      reservation.departure_date === tomorrowKey ||
      overlapsOccupiedOnDate(reservation, todayKey);

    if (!touchesOpsWindow) continue;

    if (reservation.reconciliation_status === "missing_on_source") {
      attentionItems.push({
        id: `recon-${reservation.id}`,
        level: "high",
        kind: "missing_on_source",
        title: "Imported reservation missing on source",
        detail: `${reservation.guest_display_name} (${reservation.arrival_date} → ${reservation.departure_date})`,
        href: `/reservations/${reservation.id}/edit`,
        reservation_id: reservation.id,
      });
    }

    const arrivingSoon =
      reservation.arrival_date === todayKey || reservation.arrival_date === tomorrowKey;

    if (arrivingSoon && !reservation.has_usable_lock_code) {
      attentionItems.push({
        id: `lock-${reservation.id}`,
        level: "medium",
        kind: "missing_lock_code",
        title: "Arrival missing usable lock code",
        detail: `${reservation.guest_display_name} arriving ${reservation.arrival_date}`,
        href: `/reservations/${reservation.id}/edit`,
        reservation_id: reservation.id,
      });
    }
  }

  for (const turnover of turnoverItems) {
    if (turnover.checklist_status === "issue") {
      attentionItems.push({
        id: `turnover-issue-${turnover.date_key}`,
        level: "high",
        kind: "turnover_issue",
        title: "Turnover issue needs attention",
        detail: `${turnover.title}${turnover.checklist_notes ? ` — ${turnover.checklist_notes}` : ""}`,
        href: "/operations",
      });
    }
  }

  return {
    today_key: todayKey,
    tomorrow_key: tomorrowKey,
    today_label: toFriendlyDate(referenceDate),
    tomorrow_label: toFriendlyDate(tomorrowDate),

    arrivals_today: arrivalsToday,
    arrivals_tomorrow: arrivalsTomorrow,
    departures_today: departuresToday,
    departures_tomorrow: departuresTomorrow,
    currently_occupied: currentlyOccupied,

    owner_blocks_today: ownerBlocksToday,
    owner_blocks_tomorrow: ownerBlocksTomorrow,

    turnover_items: turnoverItems,
    attention_items: attentionItems,
  };
}