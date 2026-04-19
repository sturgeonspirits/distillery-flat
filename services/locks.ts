import { createClient } from "@/supabase/server";
import type { SmartLock } from "@/types/smart-lock";

export async function getSmartLocks(unit_id?: string): Promise<SmartLock[]> {
  const supabase = await createClient();

  let query = supabase
    .from("smart_locks")
    .select("*")
    .order("created_at", { ascending: true });

  if (unit_id) {
    query = query.eq("unit_id", unit_id);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to load smart locks: ${error.message}`);
  }

  return (data ?? []) as SmartLock[];
}

export async function getActiveSmartLocks(unit_id?: string): Promise<SmartLock[]> {
  const supabase = await createClient();

  let query = supabase
    .from("smart_locks")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (unit_id) {
    query = query.eq("unit_id", unit_id);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to load active smart locks: ${error.message}`);
  }

  return (data ?? []) as SmartLock[];
}

export async function getSmartLockById(id: string): Promise<SmartLock> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("smart_locks")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(`Failed to load smart lock: ${error.message}`);
  }

  return data as SmartLock;
}

export async function createSmartLock(input: {
  unit_id: string;
  name: string;
  provider: string;
  external_lock_id?: string | null;
  is_active?: boolean;
}): Promise<SmartLock> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("smart_locks")
    .insert([
      {
        unit_id: input.unit_id,
        name: input.name.trim(),
        provider: input.provider.trim(),
        external_lock_id: input.external_lock_id ?? null,
        is_active: input.is_active ?? true,
      },
    ])
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create smart lock: ${error.message}`);
  }

  return data as SmartLock;
}

export async function updateSmartLock(input: {
  id: string;
  name?: string;
  provider?: string;
  external_lock_id?: string | null;
  is_active?: boolean;
}): Promise<SmartLock> {
  const supabase = await createClient();
  const updatePayload: Record<string, unknown> = {};

  if (input.name !== undefined) {
    updatePayload.name = input.name.trim();
  }

  if (input.provider !== undefined) {
    updatePayload.provider = input.provider.trim();
  }

  if (input.external_lock_id !== undefined) {
    updatePayload.external_lock_id = input.external_lock_id;
  }

  if (input.is_active !== undefined) {
    updatePayload.is_active = input.is_active;
  }

  const { data, error } = await supabase
    .from("smart_locks")
    .update(updatePayload)
    .eq("id", input.id)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to update smart lock: ${error.message}`);
  }

  return data as SmartLock;
}

export async function deleteSmartLock(id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("smart_locks")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to delete smart lock: ${error.message}`);
  }
}