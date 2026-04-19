export type LockAccessCodeStatus =
  | "pending"
  | "active"
  | "expired"
  | "revoked"
  | "failed";

export type LockAccessCode = {
  id: string;
  reservation_id: string | null;
  owner_block_id: string | null;
  smart_lock_id: string;
  code: string;
  starts_at: string;
  ends_at: string;
  status: LockAccessCodeStatus;
  external_code_id: string | null;
  provider_payload: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};