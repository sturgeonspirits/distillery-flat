import type { VEvent } from "node-ical";
import type { Reservation } from "@/types/reservation";
import {
  reconcileImportedReservationsForSource,
  upsertImportedReservation,
} from "@/services/reservations";

type SyncIcalFeedInput = {
  unit_id: string;
  source_name: string;
  feed_url: string;
};

export type IcalSyncResult = {
  source_name: string;
  total_events: number;
  synced: number;
  skipped: number;
  flagged_missing: number;
  reservations: Reservation[];
};

type ParsedIcalEvent = VEvent;

function isVEvent(value: unknown): value is VEvent {
  return (
    !!value &&
    typeof value === "object" &&
    "type" in value &&
    value.type === "VEVENT"
  );
}

function toDateOnly(value: Date | string | null | undefined): string | null {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function inferGuestName(event: ParsedIcalEvent, sourceName: string): string {
  const summary = String(event.summary || "").trim();
  if (summary) return summary;
  return `${sourceName} iCal Import`;
}

function inferStatus(
  event: ParsedIcalEvent,
): "inquiry" | "confirmed" | "checked_in" | "checked_out" | "cancelled" {
  const status = String(event.status || "").toUpperCase();

  if (status === "CANCELLED") {
    return "cancelled";
  }

  return "confirmed";
}

function buildRawImport(event: ParsedIcalEvent) {
  return {
    uid: event.uid ?? null,
    summary: event.summary ?? null,
    description: event.description ?? null,
    status: event.status ?? null,
    location: event.location ?? null,
    start: toDateOnly(event.start),
    end: toDateOnly(event.end),
  };
}

export async function syncIcalFeed(
  input: SyncIcalFeedInput,
): Promise<IcalSyncResult> {
  const { unit_id, source_name, feed_url } = input;

  if (!unit_id) {
    throw new Error("Unit id is required.");
  }

  if (!source_name.trim()) {
    throw new Error("Source name is required.");
  }

  if (!feed_url.trim()) {
    throw new Error("iCal feed URL is required.");
  }

  const response = await fetch(feed_url, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${source_name} iCal feed: ${response.status} ${response.statusText}`,
    );
  }

  const icsText = await response.text();

  const icalModule = await import("node-ical");
  const ical = icalModule.default ?? icalModule;
  const parsed = await ical.async.parseICS(icsText);

  const events = Object.values(parsed).filter(isVEvent);

  const reservations: Reservation[] = [];
  const seenExternalIds: string[] = [];
  let skipped = 0;

  for (const event of events) {
    const external_reservation_id = String(event.uid || "").trim();
    const check_in = toDateOnly(event.start);
    const check_out = toDateOnly(event.end);

    if (!external_reservation_id || !check_in || !check_out) {
      skipped += 1;
      continue;
    }

    if (check_out <= check_in) {
      skipped += 1;
      continue;
    }

    seenExternalIds.push(external_reservation_id);

    const reservation = await upsertImportedReservation({
      unit_id,
      channel: "iCal",
      external_channel: source_name.trim(),
      external_reservation_id,
      guest_name: inferGuestName(event, source_name),
      check_in,
      check_out,
      status: inferStatus(event),
      guest_count: 1,
      nightly_rate: 0,
      cleaning_fee: 0,
      raw_import: buildRawImport(event),
    });

    reservations.push(reservation);
  }

  const reconciliation = await reconcileImportedReservationsForSource({
    unit_id,
    external_channel: source_name.trim(),
    seen_external_reservation_ids: seenExternalIds,
  });

  return {
    source_name,
    total_events: events.length,
    synced: reservations.length,
    skipped,
    flagged_missing: reconciliation.flagged_missing,
    reservations,
  };
}