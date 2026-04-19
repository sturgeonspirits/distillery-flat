import { supabaseAdmin } from "@/supabase/admin";

export type IcalSyncRun = {
  id: string;
  unit_id: string;
  ical_source_id: string | null;
  source_name: string;
  trigger: "manual" | "scheduled";
  status: "running" | "success" | "error";
  started_at: string;
  finished_at: string | null;
  total_events: number;
  synced: number;
  skipped: number;
  error_message: string | null;
};

export async function createIcalSyncRun(input: {
  unit_id: string;
  ical_source_id: string | null;
  source_name: string;
  trigger: "manual" | "scheduled";
}): Promise<IcalSyncRun> {
  const { data, error } = await supabaseAdmin
    .from("ical_sync_runs")
    .insert([
      {
        unit_id: input.unit_id,
        ical_source_id: input.ical_source_id,
        source_name: input.source_name,
        trigger: input.trigger,
        status: "running",
      },
    ])
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create iCal sync run: ${error.message}`);
  }

  return data as IcalSyncRun;
}

export async function finishIcalSyncRunSuccess(input: {
  id: string;
  total_events: number;
  synced: number;
  skipped: number;
}): Promise<void> {
  const { error } = await supabaseAdmin
    .from("ical_sync_runs")
    .update({
      status: "success",
      finished_at: new Date().toISOString(),
      total_events: input.total_events,
      synced: input.synced,
      skipped: input.skipped,
      error_message: null,
    })
    .eq("id", input.id);

  if (error) {
    throw new Error(`Failed to finish iCal sync run: ${error.message}`);
  }
}

export async function finishIcalSyncRunError(input: {
  id: string;
  error_message: string;
}): Promise<void> {
  const { error } = await supabaseAdmin
    .from("ical_sync_runs")
    .update({
      status: "error",
      finished_at: new Date().toISOString(),
      error_message: input.error_message,
    })
    .eq("id", input.id);

  if (error) {
    throw new Error(`Failed to mark iCal sync run as failed: ${error.message}`);
  }
}

export async function getRecentIcalSyncRuns(
  unit_id: string,
  limit = 20,
): Promise<IcalSyncRun[]> {
  const { data, error } = await supabaseAdmin
    .from("ical_sync_runs")
    .select("*")
    .eq("unit_id", unit_id)
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load iCal sync runs: ${error.message}`);
  }

  return (data ?? []) as IcalSyncRun[];
}