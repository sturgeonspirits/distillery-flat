import { createClient } from "@/supabase/server";
import { supabaseAdmin } from "@/supabase/admin";

export type IcalSource = {
  id: string;
  unit_id: string;
  source_name: string;
  feed_url: string;
  is_active: boolean;
  last_synced_at: string | null;
  last_sync_status: string | null;
  last_error: string | null;
  last_result: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export async function getIcalSources(unit_id?: string): Promise<IcalSource[]> {
  const supabase = await createClient();

  let query = supabase
    .from("ical_sources")
    .select("*")
    .order("source_name", { ascending: true });

  if (unit_id) {
    query = query.eq("unit_id", unit_id);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to load iCal sources: ${error.message}`);
  }

  return (data ?? []) as IcalSource[];
}

export async function getActiveIcalSources(unit_id?: string): Promise<IcalSource[]> {
  let query = supabaseAdmin
    .from("ical_sources")
    .select("*")
    .eq("is_active", true)
    .order("source_name", { ascending: true });

  if (unit_id) {
    query = query.eq("unit_id", unit_id);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to load active iCal sources: ${error.message}`);
  }

  return (data ?? []) as IcalSource[];
}

export async function getIcalSourceById(id: string): Promise<IcalSource> {
  const { data, error } = await supabaseAdmin
    .from("ical_sources")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(`Failed to load iCal source: ${error.message}`);
  }

  return data as IcalSource;
}

export async function createIcalSource(input: {
  unit_id: string;
  source_name: string;
  feed_url: string;
  is_active?: boolean;
}): Promise<IcalSource> {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("ical_sources")
    .insert([
      {
        unit_id: input.unit_id,
        source_name: input.source_name.trim(),
        feed_url: input.feed_url.trim(),
        is_active: input.is_active ?? true,
        updated_at: nowIso,
      },
    ])
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create iCal source: ${error.message}`);
  }

  return data as IcalSource;
}

export async function deleteIcalSource(id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("ical_sources")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to delete iCal source: ${error.message}`);
  }
}

export async function markIcalSourceSyncSuccess(input: {
  id: string;
  total_events: number;
  synced: number;
  skipped: number;
}): Promise<void> {
  const nowIso = new Date().toISOString();

  const { error } = await supabaseAdmin
    .from("ical_sources")
    .update({
      last_synced_at: nowIso,
      last_sync_status: "success",
      last_error: null,
      last_result: {
        total_events: input.total_events,
        synced: input.synced,
        skipped: input.skipped,
      },
      updated_at: nowIso,
    })
    .eq("id", input.id);

  if (error) {
    throw new Error(`Failed to update iCal source sync status: ${error.message}`);
  }
}

export async function markIcalSourceSyncError(input: {
  id: string;
  error_message: string;
}): Promise<void> {
  const nowIso = new Date().toISOString();

  const { error } = await supabaseAdmin
    .from("ical_sources")
    .update({
      last_sync_status: "error",
      last_error: input.error_message,
      updated_at: nowIso,
    })
    .eq("id", input.id);

  if (error) {
    throw new Error(`Failed to update iCal source error state: ${error.message}`);
  }
}