import { randomBytes } from "crypto";
import { createClient } from "@/supabase/server";
import { supabaseAdmin } from "@/supabase/admin";
import type { Reservation } from "@/types/reservation";
import type {
  GuestPortalContentSection,
  GuestPortalSession,
  GuestPortalMessageRequest,
  GuestPortalPageData,
  GuestPortalLockCode,
} from "@/types/guest-portal";

const UNIT_ID = "cdd0a039-ef0a-44b5-a68d-339866029d42";

function mapContentRow(row: Record<string, unknown>): GuestPortalContentSection {
  return {
    id: String(row.id),
    unit_id: String(row.unit_id),
    section_key: String(row.section_key),
    title: String(row.title),
    body: String(row.body ?? ""),
    sort_order: Number(row.sort_order ?? 100),
    is_active: Boolean(row.is_active),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function mapSessionRow(row: Record<string, unknown>): GuestPortalSession {
  return {
    id: String(row.id),
    unit_id: String(row.unit_id),
    reservation_id: String(row.reservation_id),
    access_token: String(row.access_token),
    expires_at: row.expires_at ? String(row.expires_at) : null,
    revoked_at: row.revoked_at ? String(row.revoked_at) : null,
    created_at: String(row.created_at),
    last_accessed_at: row.last_accessed_at
      ? String(row.last_accessed_at)
      : null,
  };
}

function mapMessageRequestRow(
  row: Record<string, unknown>,
): GuestPortalMessageRequest {
  return {
    id: String(row.id),
    unit_id: String(row.unit_id),
    reservation_id: String(row.reservation_id),
    session_id: String(row.session_id),
    guest_name: String(row.guest_name),
    guest_email: row.guest_email ? String(row.guest_email) : null,
    guest_phone: row.guest_phone ? String(row.guest_phone) : null,
    message: String(row.message),
    status: String(row.status) as GuestPortalMessageRequest["status"],
    created_at: String(row.created_at),
    resolved_at: row.resolved_at ? String(row.resolved_at) : null,
  };
}

export function buildGuestPortalUrl(token: string) {
  const base =
    process.env.APP_URL ||
    process.env.SYNC_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "";

  const path = `/guest/${token}`;

  return base ? `${base.replace(/\/$/, "")}${path}` : path;
}

export async function getGuestPortalContent(
  unit_id = UNIT_ID,
): Promise<GuestPortalContentSection[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("guest_portal_content")
    .select("*")
    .eq("unit_id", unit_id)
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true });

  if (error) {
    throw new Error(`Failed to load guest portal content: ${error.message}`);
  }

  return (data ?? []).map((row) =>
    mapContentRow(row as Record<string, unknown>),
  );
}

export async function upsertGuestPortalContent(input: {
  section_key: string;
  title: string;
  body: string;
  sort_order: number;
  is_active: boolean;
  unit_id?: string;
}): Promise<GuestPortalContentSection> {
  const supabase = await createClient();

  const payload = {
    unit_id: input.unit_id ?? UNIT_ID,
    section_key: input.section_key.trim(),
    title: input.title.trim(),
    body: input.body.trim(),
    sort_order: input.sort_order,
    is_active: input.is_active,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("guest_portal_content")
    .upsert(payload, { onConflict: "unit_id,section_key" })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to save guest portal content: ${error.message}`);
  }

  return mapContentRow(data as Record<string, unknown>);
}

export async function deleteGuestPortalContent(id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("guest_portal_content")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to delete guest portal content: ${error.message}`);
  }
}

export async function getGuestPortalSessions(
  unit_id = UNIT_ID,
): Promise<GuestPortalSession[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("guest_portal_sessions")
    .select("*")
    .eq("unit_id", unit_id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load guest portal sessions: ${error.message}`);
  }

  return (data ?? []).map((row) =>
    mapSessionRow(row as Record<string, unknown>),
  );
}

export async function getActiveGuestPortalSessionByReservation(
  reservation_id: string,
): Promise<GuestPortalSession | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("guest_portal_sessions")
    .select("*")
    .eq("reservation_id", reservation_id)
    .is("revoked_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to load active guest portal session: ${error.message}`,
    );
  }

  if (!data) return null;

  const session = mapSessionRow(data as Record<string, unknown>);

  if (session.expires_at && new Date(session.expires_at) < new Date()) {
    return null;
  }

  return session;
}

export async function createGuestPortalSessionForReservation(
  reservation_id: string,
): Promise<GuestPortalSession> {
  const supabase = await createClient();

  const { data: reservation, error: reservationError } = await supabase
    .from("reservations")
    .select("*")
    .eq("id", reservation_id)
    .single();

  if (reservationError || !reservation) {
    throw new Error(
      `Failed to load reservation for portal session: ${reservationError?.message ?? "Unknown error"}`,
    );
  }

  await supabase
    .from("guest_portal_sessions")
    .update({ revoked_at: new Date().toISOString() })
    .eq("reservation_id", reservation_id)
    .is("revoked_at", null);

  const access_token = `gptl_${randomBytes(24).toString("hex")}`;

  const { data, error } = await supabase
    .from("guest_portal_sessions")
    .insert([
      {
        unit_id: String((reservation as Record<string, unknown>).unit_id),
        reservation_id,
        access_token,
      },
    ])
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create guest portal session: ${error.message}`);
  }

  return mapSessionRow(data as Record<string, unknown>);
}

export async function revokeGuestPortalSession(id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("guest_portal_sessions")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to revoke guest portal session: ${error.message}`);
  }
}

export async function getGuestPortalMessageRequests(
  unit_id = UNIT_ID,
): Promise<GuestPortalMessageRequest[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("guest_portal_message_requests")
    .select("*")
    .eq("unit_id", unit_id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(
      `Failed to load guest portal message requests: ${error.message}`,
    );
  }

  return (data ?? []).map((row) =>
    mapMessageRequestRow(row as Record<string, unknown>),
  );
}

export async function resolveGuestPortalMessageRequest(
  id: string,
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("guest_portal_message_requests")
    .update({
      status: "resolved",
      resolved_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    throw new Error(
      `Failed to resolve guest portal message request: ${error.message}`,
    );
  }
}

async function getGuestPortalSessionByTokenAdmin(
  access_token: string,
): Promise<GuestPortalSession | null> {
  const { data, error } = await supabaseAdmin
    .from("guest_portal_sessions")
    .select("*")
    .eq("access_token", access_token)
    .is("revoked_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load guest portal session: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const session = mapSessionRow(data as Record<string, unknown>);

  if (session.expires_at && new Date(session.expires_at) < new Date()) {
    return null;
  }

  return session;
}

export async function getGuestPortalPageData(
  access_token: string,
): Promise<GuestPortalPageData | null> {
  const session = await getGuestPortalSessionByTokenAdmin(access_token);

  if (!session) {
    return null;
  }

  const { data: reservation, error: reservationError } = await supabaseAdmin
    .from("reservations")
    .select("*")
    .eq("id", session.reservation_id)
    .single();

  if (reservationError || !reservation) {
    throw new Error(
      `Failed to load guest portal reservation: ${reservationError?.message ?? "Unknown error"}`,
    );
  }

  const { data: sections, error: sectionsError } = await supabaseAdmin
    .from("guest_portal_content")
    .select("*")
    .eq("unit_id", session.unit_id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true });

  if (sectionsError) {
    throw new Error(
      `Failed to load guest portal content sections: ${sectionsError.message}`,
    );
  }

  const { data: lockCodes, error: lockCodesError } = await supabaseAdmin
    .from("lock_access_codes")
    .select("*")
    .eq("reservation_id", session.reservation_id)
    .in("status", ["pending", "active"])
    .order("starts_at", { ascending: true });

  if (lockCodesError) {
    throw new Error(
      `Failed to load guest portal lock codes: ${lockCodesError.message}`,
    );
  }

  const smartLockIds = Array.from(
    new Set(
      (lockCodes ?? []).map((row) => String((row as Record<string, unknown>).smart_lock_id)),
    ),
  );

  const smartLockNames = new Map<string, string>();

  if (smartLockIds.length > 0) {
    const { data: smartLocks, error: smartLocksError } = await supabaseAdmin
      .from("smart_locks")
      .select("*")
      .in("id", smartLockIds);

    if (smartLocksError) {
      throw new Error(
        `Failed to load smart locks for guest portal: ${smartLocksError.message}`,
      );
    }

    for (const lock of smartLocks ?? []) {
      const lockRow = lock as Record<string, unknown>;
      smartLockNames.set(String(lockRow.id), String(lockRow.name));
    }
  }

  await supabaseAdmin
    .from("guest_portal_sessions")
    .update({ last_accessed_at: new Date().toISOString() })
    .eq("id", session.id);

  const normalizedLockCodes: GuestPortalLockCode[] = (lockCodes ?? []).map(
    (row) => {
      const data = row as Record<string, unknown>;
      const smart_lock_id = String(data.smart_lock_id);

      return {
        id: String(data.id),
        smart_lock_id,
        smart_lock_name: smartLockNames.get(smart_lock_id) ?? null,
        code: String(data.code),
        status: String(data.status),
        starts_at: String(data.starts_at),
        ends_at: String(data.ends_at),
      };
    },
  );

  return {
    session,
    reservation: reservation as Reservation,
    sections: (sections ?? []).map((row) =>
      mapContentRow(row as Record<string, unknown>),
    ),
    lockCodes: normalizedLockCodes,
  };
}

export async function createGuestPortalMessageRequestByToken(input: {
  access_token: string;
  guest_name: string;
  guest_email?: string | null;
  guest_phone?: string | null;
  message: string;
}): Promise<GuestPortalMessageRequest> {
  const session = await getGuestPortalSessionByTokenAdmin(input.access_token);

  if (!session) {
    throw new Error("This guest portal link is no longer active.");
  }

  const trimmedGuestName = input.guest_name.trim();
  const trimmedMessage = input.message.trim();

  if (!trimmedGuestName) {
    throw new Error("Guest name is required.");
  }

  if (!trimmedMessage) {
    throw new Error("Message is required.");
  }

  const { data, error } = await supabaseAdmin
    .from("guest_portal_message_requests")
    .insert([
      {
        unit_id: session.unit_id,
        reservation_id: session.reservation_id,
        session_id: session.id,
        guest_name: trimmedGuestName,
        guest_email: input.guest_email?.trim() || null,
        guest_phone: input.guest_phone?.trim() || null,
        message: trimmedMessage,
        status: "new",
      },
    ])
    .select("*")
    .single();

  if (error) {
    throw new Error(
      `Failed to create guest portal message request: ${error.message}`,
    );
  }

  return mapMessageRequestRow(data as Record<string, unknown>);
}
