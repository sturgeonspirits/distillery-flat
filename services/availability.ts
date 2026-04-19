import { createClient } from "@/supabase/server";

type DateRangeInput = {
  unit_id: string;
  start_date: string;
  end_date: string;
  exclude_reservation_id?: string;
  exclude_owner_block_id?: string;
};

export type AvailabilityConflict = {
  type: "reservation" | "owner_block";
  id: string;
  label: string;
  start_date: string;
  end_date: string;
};

function assertValidDateRange(start_date: string, end_date: string) {
  if (!start_date || !end_date) {
    throw new Error("Start date and end date are required.");
  }

  const start = new Date(start_date);
  const end = new Date(end_date);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("Invalid date.");
  }

  if (end <= start) {
    throw new Error("End date must be after start date.");
  }
}

export async function getAvailabilityConflicts(
  input: DateRangeInput,
): Promise<AvailabilityConflict[]> {
  const {
    unit_id,
    start_date,
    end_date,
    exclude_reservation_id,
    exclude_owner_block_id,
  } = input;

  assertValidDateRange(start_date, end_date);

  const supabase = await createClient();

  let reservationsQuery = supabase
    .from("reservations")
    .select("id, guest_name, check_in, check_out, status")
    .eq("unit_id", unit_id)
    .neq("status", "cancelled")
    .lt("check_in", end_date)
    .gt("check_out", start_date);

  if (exclude_reservation_id) {
    reservationsQuery = reservationsQuery.neq("id", exclude_reservation_id);
  }

  let ownerBlocksQuery = supabase
    .from("owner_blocks")
    .select("id, title, start_date, end_date")
    .eq("unit_id", unit_id)
    .lt("start_date", end_date)
    .gt("end_date", start_date);

  if (exclude_owner_block_id) {
    ownerBlocksQuery = ownerBlocksQuery.neq("id", exclude_owner_block_id);
  }

  const [
    { data: reservations, error: reservationsError },
    { data: ownerBlocks, error: ownerBlocksError },
  ] = await Promise.all([reservationsQuery, ownerBlocksQuery]);

  if (reservationsError) {
    throw new Error(
      `Failed to check reservation conflicts: ${reservationsError.message}`,
    );
  }

  if (ownerBlocksError) {
    throw new Error(
      `Failed to check owner block conflicts: ${ownerBlocksError.message}`,
    );
  }

  const reservationConflicts: AvailabilityConflict[] = (reservations ?? []).map(
    (row) => ({
      type: "reservation",
      id: row.id,
      label: row.guest_name,
      start_date: row.check_in,
      end_date: row.check_out,
    }),
  );

  const ownerBlockConflicts: AvailabilityConflict[] = (ownerBlocks ?? []).map(
    (row) => ({
      type: "owner_block",
      id: row.id,
      label: row.title,
      start_date: row.start_date,
      end_date: row.end_date,
    }),
  );

  return [...reservationConflicts, ...ownerBlockConflicts];
}

export async function assertUnitIsAvailable(input: DateRangeInput) {
  const conflicts = await getAvailabilityConflicts(input);

  if (conflicts.length > 0) {
    const summary = conflicts
      .map(
        (conflict) =>
          `${conflict.type}: ${conflict.label} (${conflict.start_date} → ${conflict.end_date})`,
      )
      .join("; ");

    throw new Error(`Date conflict found. ${summary}`);
  }
}