import { createClient } from "@/supabase/server";
import type {
  LockAccessCode,
  LockAccessCodeStatus,
} from "@/types/lock-access-code";

export async function getLockAccessCodes(): Promise<LockAccessCode[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("lock_access_codes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load lock access codes: ${error.message}`);
  }

  return (data ?? []) as LockAccessCode[];
}

export async function getLockAccessCodesByReservation(
  reservation_id: string,
): Promise<LockAccessCode[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("lock_access_codes")
    .select("*")
    .eq("reservation_id", reservation_id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(
      `Failed to load reservation lock access codes: ${error.message}`,
    );
  }

  return (data ?? []) as LockAccessCode[];
}

export async function getLockAccessCodeById(id: string): Promise<LockAccessCode> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("lock_access_codes")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(`Failed to load lock access code: ${error.message}`);
  }

  return data as LockAccessCode;
}

export async function createLockAccessCode(input: {
  reservation_id?: string | null;
  owner_block_id?: string | null;
  smart_lock_id: string;
  code: string;
  starts_at: string;
  ends_at: string;
  status?: LockAccessCodeStatus;
  external_code_id?: string | null;
  provider_payload?: Record<string, unknown> | null;
}): Promise<LockAccessCode> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("lock_access_codes")
    .insert([
      {
        reservation_id: input.reservation_id ?? null,
        owner_block_id: input.owner_block_id ?? null,
        smart_lock_id: input.smart_lock_id,
        code: input.code,
        starts_at: input.starts_at,
        ends_at: input.ends_at,
        status: input.status ?? "pending",
        external_code_id: input.external_code_id ?? null,
        provider_payload: input.provider_payload ?? null,
      },
    ])
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create lock access code: ${error.message}`);
  }

  return data as LockAccessCode;
}

export async function updateLockAccessCode(input: {
  id: string;
  code?: string;
  starts_at?: string;
  ends_at?: string;
  status?: LockAccessCodeStatus;
  external_code_id?: string | null;
  provider_payload?: Record<string, unknown> | null;
}): Promise<LockAccessCode> {
  const supabase = await createClient();

  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.code !== undefined) {
    updatePayload.code = input.code;
  }

  if (input.starts_at !== undefined) {
    updatePayload.starts_at = input.starts_at;
  }

  if (input.ends_at !== undefined) {
    updatePayload.ends_at = input.ends_at;
  }

  if (input.status !== undefined) {
    updatePayload.status = input.status;
  }

  if (input.external_code_id !== undefined) {
    updatePayload.external_code_id = input.external_code_id;
  }

  if (input.provider_payload !== undefined) {
    updatePayload.provider_payload = input.provider_payload;
  }

  const { data, error } = await supabase
    .from("lock_access_codes")
    .update(updatePayload)
    .eq("id", input.id)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to update lock access code: ${error.message}`);
  }

  return data as LockAccessCode;
}

export async function setLockAccessCodeStatus(
  id: string,
  status: LockAccessCodeStatus,
): Promise<LockAccessCode> {
  return updateLockAccessCode({
    id,
    status,
  });
}

export async function revokeLockAccessCode(id: string): Promise<LockAccessCode> {
  return updateLockAccessCode({
    id,
    status: "revoked",
  });
}

export async function deleteLockAccessCode(id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("lock_access_codes")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to delete lock access code: ${error.message}`);
  }
}