export type SmartLock = {
  id: string;
  unit_id: string;
  name: string;
  provider: string;
  external_lock_id: string | null;
  is_active: boolean;
  created_at: string;
};