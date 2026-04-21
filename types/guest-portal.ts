import type { Reservation } from "@/types/reservation";

export type GuestPortalContentSection = {
  id: string;
  unit_id: string;
  section_key: string;
  title: string;
  body: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type GuestPortalSession = {
  id: string;
  unit_id: string;
  reservation_id: string;
  access_token: string;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
  last_accessed_at: string | null;
};

export type GuestPortalMessageRequestStatus = "new" | "resolved";

export type GuestPortalMessageRequest = {
  id: string;
  unit_id: string;
  reservation_id: string;
  session_id: string;
  guest_name: string;
  guest_email: string | null;
  guest_phone: string | null;
  message: string;
  status: GuestPortalMessageRequestStatus;
  created_at: string;
  resolved_at: string | null;
};

export type GuestPortalLockCode = {
  id: string;
  smart_lock_id: string;
  smart_lock_name: string | null;
  code: string;
  status: string;
  starts_at: string;
  ends_at: string;
};

export type GuestPortalPageData = {
  session: GuestPortalSession;
  reservation: Reservation;
  sections: GuestPortalContentSection[];
  lockCodes: GuestPortalLockCode[];
};
