import { createClient } from "@/supabase/server";
import type { TurnoverChecklist, TurnoverStatus } from "@/types/turnover";

export async function getTurnoverChecklistsForDates(input: {
  unit_id: string;
  dates: string[];
}): Promise<TurnoverChecklist[]> {
  const supabase = await createClient();

  const dates = [
    ...new Set(input.dates.map((value) => value.trim()).filter(Boolean)),
  ];

  if (!input.unit_id) {
    throw new Error("Unit id is required.");
  }

  if (dates.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("turnover_checklists")
    .select("*")
    .eq("unit_id", input.unit_id)
    .in("turnover_date", dates)
    .order("turnover_date", { ascending: true });

  if (error) {
    throw new Error(`Failed to load turnover checklists: ${error.message}`);
  }

  return (data ?? []) as TurnoverChecklist[];
}

export async function upsertTurnoverChecklist(input: {
  unit_id: string;
  turnover_date: string;
  status: TurnoverStatus;
  notes: string | null;
}): Promise<TurnoverChecklist> {
  const supabase = await createClient();

  if (!input.unit_id) {
    throw new Error("Unit id is required.");
  }

  if (!input.turnover_date) {
    throw new Error("Turnover date is required.");
  }

  const notes = input.notes?.trim() ? input.notes.trim() : null;

  const { data, error } = await supabase
    .from("turnover_checklists")
    .upsert(
      [
        {
          unit_id: input.unit_id,
          turnover_date: input.turnover_date,
          status: input.status,
          notes,
          updated_at: new Date().toISOString(),
        },
      ],
      { onConflict: "unit_id,turnover_date" },
    )
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to save turnover checklist: ${error.message}`);
  }

  return data as TurnoverChecklist;
}