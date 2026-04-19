import { createClient } from "@/supabase/server";
import { supabaseAdmin } from "@/supabase/admin";
import type { Reservation } from "@/types/reservation";

export async function getReservations(): Promise<Reservation[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reservations")
    .select("*")
    .order("check_in", { ascending: true });

  if (error) {
    throw new Error(`Failed to load reservations: ${error.message}`);
  }

  return (data ?? []) as Reservation[];
}

export async function getReservationById(id: string): Promise<Reservation> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reservations")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(`Failed to load reservation: ${error.message}`);
  }

  return data as Reservation;
}

export async function getUpcomingReservations(): Promise<Reservation[]> {
  return getReservations();
}

export async function createReservation(input: {
  unit_id: string;
  guest_name: string;
  channel: "Airbnb" | "Vrbo" | "Manual" | "iCal";
  check_in: string;
  check_out: string;
  status: "inquiry" | "confirmed" | "checked_in" | "checked_out" | "cancelled";
  guest_count: number;
  nightly_rate: number;
  cleaning_fee: number;
  applied_pricing_rule_id: string | null;
  applied_min_stay: number | null;
  external_channel?: string | null;
  external_reservation_id?: string | null;
  imported_at?: string | null;
  last_synced_at?: string | null;
  source_last_seen_at?: string | null;
  source_missing_since?: string | null;
  reconciliation_status?: "ok" | "missing_on_source" | "manual_override" | null;
  raw_import?: Record<string, unknown> | null;
}): Promise<Reservation> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reservations")
    .insert([
      {
        ...input,
        external_channel: input.external_channel ?? null,
        external_reservation_id: input.external_reservation_id ?? null,
        imported_at: input.imported_at ?? null,
        last_synced_at: input.last_synced_at ?? null,
        source_last_seen_at: input.source_last_seen_at ?? null,
        source_missing_since: input.source_missing_since ?? null,
        reconciliation_status: input.reconciliation_status ?? null,
        raw_import: input.raw_import ?? null,
      },
    ])
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create reservation: ${error.message}`);
  }

  return data as Reservation;
}

export async function updateReservation(input: {
  id: string;
  guest_name: string;
  channel: "Airbnb" | "Vrbo" | "Manual" | "iCal";
  check_in: string;
  check_out: string;
  status: "inquiry" | "confirmed" | "checked_in" | "checked_out" | "cancelled";
  guest_count: number;
  nightly_rate: number;
  cleaning_fee: number;
  applied_pricing_rule_id: string | null;
  applied_min_stay: number | null;
}): Promise<Reservation> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reservations")
    .update({
      guest_name: input.guest_name,
      channel: input.channel,
      check_in: input.check_in,
      check_out: input.check_out,
      status: input.status,
      guest_count: input.guest_count,
      nightly_rate: input.nightly_rate,
      cleaning_fee: input.cleaning_fee,
      applied_pricing_rule_id: input.applied_pricing_rule_id,
      applied_min_stay: input.applied_min_stay,
    })
    .eq("id", input.id)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to update reservation: ${error.message}`);
  }

  return data as Reservation;
}

export async function deleteReservation(id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("reservations")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to delete reservation: ${error.message}`);
  }
}

export async function markReservationManualOverride(
  id: string,
): Promise<Reservation> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reservations")
    .update({
      reconciliation_status: "manual_override",
      source_missing_since: null,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(
      `Failed to mark reservation as manual override: ${error.message}`,
    );
  }

  return data as Reservation;
}

export async function clearReservationMissingOnSource(
  id: string,
): Promise<Reservation> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reservations")
    .update({
      reconciliation_status: "ok",
      source_missing_since: null,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(
      `Failed to clear reservation missing-on-source flag: ${error.message}`,
    );
  }

  return data as Reservation;
}

export type ImportedReservationInput = {
  unit_id: string;
  channel: "Airbnb" | "Vrbo" | "iCal";
  external_channel: string;
  external_reservation_id: string;
  guest_name: string;
  check_in: string;
  check_out: string;
  status: "inquiry" | "confirmed" | "checked_in" | "checked_out" | "cancelled";
  guest_count: number;
  nightly_rate: number;
  cleaning_fee: number;
  raw_import?: Record<string, unknown> | null;
};

export async function upsertImportedReservation(
  input: ImportedReservationInput,
): Promise<Reservation> {
  const external_channel = input.external_channel.trim();
  const external_reservation_id = input.external_reservation_id.trim();

  if (!input.unit_id) {
    throw new Error("Unit id is required.");
  }

  if (!input.channel) {
    throw new Error("Channel is required.");
  }

  if (!external_channel) {
    throw new Error("External channel is required.");
  }

  if (!external_reservation_id) {
    throw new Error("External reservation id is required.");
  }

  const nowIso = new Date().toISOString();

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("reservations")
    .select("*")
    .eq("external_channel", external_channel)
    .eq("external_reservation_id", external_reservation_id)
    .maybeSingle();

  if (existingError) {
    throw new Error(
      `Failed to check existing imported reservation: ${existingError.message}`,
    );
  }

  if (existing) {
    const { data, error } = await supabaseAdmin
      .from("reservations")
      .update({
        unit_id: input.unit_id,
        guest_name: input.guest_name,
        channel: input.channel,
        check_in: input.check_in,
        check_out: input.check_out,
        status: input.status,
        guest_count: input.guest_count,
        nightly_rate: input.nightly_rate,
        cleaning_fee: input.cleaning_fee,
        external_channel,
        external_reservation_id,
        last_synced_at: nowIso,
        source_last_seen_at: nowIso,
        source_missing_since: null,
        reconciliation_status: "ok",
        raw_import: input.raw_import ?? null,
      })
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to update imported reservation: ${error.message}`);
    }

    return data as Reservation;
  }

  const { data, error } = await supabaseAdmin
    .from("reservations")
    .insert([
      {
        unit_id: input.unit_id,
        guest_name: input.guest_name,
        channel: input.channel,
        check_in: input.check_in,
        check_out: input.check_out,
        status: input.status,
        guest_count: input.guest_count,
        nightly_rate: input.nightly_rate,
        cleaning_fee: input.cleaning_fee,
        applied_pricing_rule_id: null,
        applied_min_stay: null,
        external_channel,
        external_reservation_id,
        imported_at: nowIso,
        last_synced_at: nowIso,
        source_last_seen_at: nowIso,
        source_missing_since: null,
        reconciliation_status: "ok",
        raw_import: input.raw_import ?? null,
      },
    ])
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to insert imported reservation: ${error.message}`);
  }

  return data as Reservation;
}

export async function reconcileImportedReservationsForSource(input: {
  unit_id: string;
  external_channel: string;
  seen_external_reservation_ids: string[];
}): Promise<{
  flagged_missing: number;
}> {
  const external_channel = input.external_channel.trim();
  const seenIds = [
    ...new Set(
      input.seen_external_reservation_ids.map((id) => id.trim()).filter(Boolean),
    ),
  ];
  const nowIso = new Date().toISOString();

  const { data: importedReservations, error } = await supabaseAdmin
    .from("reservations")
    .select("*")
    .eq("unit_id", input.unit_id)
    .eq("channel", "iCal")
    .eq("external_channel", external_channel);

  if (error) {
    throw new Error(
      `Failed to load imported reservations for reconciliation: ${error.message}`,
    );
  }

  const missingReservations = (importedReservations ?? []).filter((reservation) => {
    const externalId = reservation.external_reservation_id || "";
    return !seenIds.includes(externalId);
  });

  if (missingReservations.length === 0) {
    return { flagged_missing: 0 };
  }

  await Promise.all(
    missingReservations.map((reservation) =>
      supabaseAdmin
        .from("reservations")
        .update({
          reconciliation_status: "missing_on_source",
          source_missing_since: reservation.source_missing_since ?? nowIso,
          last_synced_at: nowIso,
        })
        .eq("id", reservation.id),
    ),
  );

  return {
    flagged_missing: missingReservations.length,
  };
}

export function getBookedNights(reservation: Reservation): number {
  const start = new Date(`${reservation.check_in}T12:00:00`);
  const end = new Date(`${reservation.check_out}T12:00:00`);
  const diffMs = end.getTime() - start.getTime();
  return Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
}

export function getReservationRevenue(reservation: Reservation): number {
  return (
    getBookedNights(reservation) * Number(reservation.nightly_rate) +
    Number(reservation.cleaning_fee)
  );
}

export function getProjectedRevenue(reservations: Reservation[]): number {
  return reservations
    .filter((r) => r.status !== "cancelled")
    .reduce((sum, r) => sum + getReservationRevenue(r), 0);
}