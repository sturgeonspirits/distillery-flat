export type SmartLockProvider = "schlage" | "yale" | "august" | "remoteLock" | "other";

export type CreateAccessCodeInput = {
  external_lock_id: string;
  code: string;
  starts_at: string;
  ends_at: string;
  reservation_id: string;
};

export type RevokeAccessCodeInput = {
  external_lock_id: string;
  external_code_id: string;
};

export interface SmartLockAdapter {
  createAccessCode(input: CreateAccessCodeInput): Promise<{
    external_code_id: string;
    provider_payload?: Record<string, unknown> | null;
  }>;

  revokeAccessCode(input: RevokeAccessCodeInput): Promise<void>;
}

export function getSmartLockAdapter(provider: SmartLockProvider): SmartLockAdapter {
  throw new Error(`Smart lock provider not configured yet: ${provider}`);
}