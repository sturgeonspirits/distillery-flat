import { getReservations } from "@/services/reservations";
import { getOwnerBlocks } from "@/services/owner-blocks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function formatUtcDateTime(value: Date) {
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  const day = String(value.getUTCDate()).padStart(2, "0");
  const hours = String(value.getUTCHours()).padStart(2, "0");
  const minutes = String(value.getUTCMinutes()).padStart(2, "0");
  const seconds = String(value.getUTCSeconds()).padStart(2, "0");

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

function formatDateOnly(value: string) {
  return value.replaceAll("-", "");
}

function buildReservationEvent(event: {
  id: string;
  guest_name: string;
  check_in: string;
  check_out: string;
  channel: string;
  status: string;
  guest_count: number;
}) {
  return [
    "BEGIN:VEVENT",
    `UID:reservation-${event.id}@sturgeon-flat-app`,
    `DTSTAMP:${formatUtcDateTime(new Date())}`,
    `DTSTART;VALUE=DATE:${formatDateOnly(event.check_in)}`,
    `DTEND;VALUE=DATE:${formatDateOnly(event.check_out)}`,
    `SUMMARY:${escapeIcsText(`Rental: ${event.guest_name}`)}`,
    `DESCRIPTION:${escapeIcsText(
      `Channel: ${event.channel}\nStatus: ${event.status}\nGuests: ${event.guest_count}`,
    )}`,
    "END:VEVENT",
  ].join("\r\n");
}

function buildOwnerBlockEvent(event: {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  reason: string | null;
}) {
  return [
    "BEGIN:VEVENT",
    `UID:owner-block-${event.id}@sturgeon-flat-app`,
    `DTSTAMP:${formatUtcDateTime(new Date())}`,
    `DTSTART;VALUE=DATE:${formatDateOnly(event.start_date)}`,
    `DTEND;VALUE=DATE:${formatDateOnly(event.end_date)}`,
    `SUMMARY:${escapeIcsText(`Unavailable: ${event.title}`)}`,
    `DESCRIPTION:${escapeIcsText(event.reason || "Owner block")}`,
    "END:VEVENT",
  ].join("\r\n");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const expectedToken = process.env.STAFF_ICAL_TOKEN;

  if (!expectedToken) {
    return new Response("Missing STAFF_ICAL_TOKEN", { status: 500 });
  }

  if (token !== expectedToken) {
    return new Response("Unauthorized", { status: 401 });
  }

  const [reservations, ownerBlocks] = await Promise.all([
    getReservations(),
    getOwnerBlocks(),
  ]);

  const reservationEvents = reservations
    .filter((reservation) => reservation.status !== "cancelled")
    .map(buildReservationEvent);

  const ownerBlockEvents = ownerBlocks.map(buildOwnerBlockEvent);

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Sturgeon Spirits//Rental Staff Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Sturgeon Flat Rentals",
    "X-WR-CALDESC:Reservations and owner blocks for staff visibility",
    ...reservationEvents,
    ...ownerBlockEvents,
    "END:VCALENDAR",
    "",
  ].join("\r\n");

  return new Response(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="sturgeon-flat-staff-calendar.ics"',
      "Cache-Control": "no-store",
    },
  });
}