import { createClient } from "@/supabase/server";
import {
  DISTILLERY_FLATS_DEFAULT_LOCKS,
  smartLockSetupKey,
} from "@/lib/smart-locks";
import type { SmartLock } from "@/types/smart-lock";

function normalizeSmartLock(row: SmartLock): SmartLock {
  return {
    ...row,
    applies_to_all_units: Boolean(row.applies_to_all_units),
  };
}

function smartLockAppliesToUnit(lock: SmartLock, unit_id: string) {
  return lock.applies_to_all_units || lock.unit_id === unit_id;
}

export async function getSmartLocks(unit_id?: string): Promise<SmartLock[]> {
  const supabase = await createClient();

  const query = supabase
    .from("smart_locks")
    .select("*")
    .order("created_at", { ascending: true });

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to load smart locks: ${error.message}`);
  }

  const locks = ((data ?? []) as SmartLock[]).map(normalizeSmartLock);

  if (unit_id) {
    return locks.filter((lock) => smartLockAppliesToUnit(lock, unit_id));
  }

  return locks;
}

export async function getActiveSmartLocks(unit_id?: string): Promise<SmartLock[]> {
  const supabase = await createClient();

  const query = supabase
    .from("smart_locks")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to load active smart locks: ${error.message}`);
  }

  const locks = ((data ?? []) as SmartLock[]).map(normalizeSmartLock);

  if (unit_id) {
    return locks.filter((lock) => smartLockAppliesToUnit(lock, unit_id));
  }

  return locks;
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

  return normalizeSmartLock(data as SmartLock);
}

export async function createSmartLock(input: {
  unit_id: string;
  name: string;
  provider: string;
  external_lock_id?: string | null;
  applies_to_all_units?: boolean;
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
        applies_to_all_units: input.applies_to_all_units ?? false,
        is_active: input.is_active ?? true,
      },
    ])
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create smart lock: ${error.message}`);
  }

  return normalizeSmartLock(data as SmartLock);
}

export async function updateSmartLock(input: {
  id: string;
  name?: string;
  provider?: string;
  external_lock_id?: string | null;
  applies_to_all_units?: boolean;
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

  if (input.applies_to_all_units !== undefined) {
    updatePayload.applies_to_all_units = input.applies_to_all_units;
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

  return normalizeSmartLock(data as SmartLock);
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

export async function createMissingDefaultSmartLocks() {
  const existingLocks = await getSmartLocks();
  const existingKeys = new Set(existingLocks.map(smartLockSetupKey));
  let created = 0;

  for (const lock of DISTILLERY_FLATS_DEFAULT_LOCKS) {
    if (existingKeys.has(smartLockSetupKey(lock))) {
      continue;
    }

    await createSmartLock({
      unit_id: lock.unit_id,
      name: lock.name,
      provider: lock.provider,
      external_lock_id: lock.external_lock_id,
      applies_to_all_units: lock.applies_to_all_units,
      is_active: true,
    });

    created += 1;
  }

  return { created };
}
