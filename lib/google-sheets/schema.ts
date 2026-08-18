import "server-only";

export type SheetCellType = "string" | "number" | "boolean" | "json";

export type SheetColumn = {
  name: string;
  type?: SheetCellType;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SheetRow = Record<string, any>;

export type UniqueConstraint = {
  name: string;
  columns: string[];
  applies?: (row: SheetRow) => boolean;
};

export type SheetTableDefinition = {
  sheetTitle: string;
  columns: SheetColumn[];
  uniqueConstraints?: UniqueConstraint[];
};

const liveLockCode = (row: SheetRow) =>
  row.status === "pending" || row.status === "active";

const activeGuestPortalSession = (row: SheetRow) => !row.revoked_at;

const importedReservation = (row: SheetRow) =>
  Boolean(row.external_channel) && Boolean(row.external_reservation_id);

export const SHEET_TABLES = {
  reservations: {
    sheetTitle: "reservations",
    columns: [
      { name: "id" },
      { name: "unit_id" },
      { name: "guest_name" },
      { name: "channel" },
      { name: "check_in" },
      { name: "check_out" },
      { name: "status" },
      { name: "guest_count", type: "number" },
      { name: "nightly_rate", type: "number" },
      { name: "cleaning_fee", type: "number" },
      { name: "applied_pricing_rule_id" },
      { name: "applied_min_stay", type: "number" },
      { name: "external_channel" },
      { name: "external_reservation_id" },
      { name: "imported_at" },
      { name: "last_synced_at" },
      { name: "source_last_seen_at" },
      { name: "source_missing_since" },
      { name: "reconciliation_status" },
      { name: "raw_import", type: "json" },
      { name: "created_at" },
    ],
    uniqueConstraints: [
      {
        name: "reservations_external_source_key",
        columns: ["external_channel", "external_reservation_id"],
        applies: importedReservation,
      },
    ],
  },
  owner_blocks: {
    sheetTitle: "owner_blocks",
    columns: [
      { name: "id" },
      { name: "unit_id" },
      { name: "title" },
      { name: "start_date" },
      { name: "end_date" },
      { name: "reason" },
      { name: "created_at" },
    ],
  },
  pricing_rules: {
    sheetTitle: "pricing_rules",
    columns: [
      { name: "id" },
      { name: "name" },
      { name: "start_date" },
      { name: "end_date" },
      { name: "nightly_rate", type: "number" },
      { name: "min_stay", type: "number" },
      { name: "priority", type: "number" },
    ],
  },
  pricing_settings: {
    sheetTitle: "pricing_settings",
    columns: [
      { name: "unit_id" },
      { name: "base_weekday_rate", type: "number" },
      { name: "base_weekend_rate", type: "number" },
      { name: "distillery_premium", type: "number" },
      { name: "eaa_weekly_target", type: "number" },
      { name: "cleaning_fee", type: "number" },
      { name: "benchmark_monthly_rent", type: "number" },
      { name: "created_at" },
      { name: "updated_at" },
    ],
    uniqueConstraints: [
      {
        name: "pricing_settings_unit_id_key",
        columns: ["unit_id"],
      },
    ],
  },
  ical_sources: {
    sheetTitle: "ical_sources",
    columns: [
      { name: "id" },
      { name: "unit_id" },
      { name: "source_name" },
      { name: "feed_url" },
      { name: "is_active", type: "boolean" },
      { name: "last_synced_at" },
      { name: "last_sync_status" },
      { name: "last_error" },
      { name: "last_result", type: "json" },
      { name: "created_at" },
      { name: "updated_at" },
    ],
  },
  smart_locks: {
    sheetTitle: "smart_locks",
    columns: [
      { name: "id" },
      { name: "unit_id" },
      { name: "name" },
      { name: "provider" },
      { name: "external_lock_id" },
      { name: "is_active", type: "boolean" },
      { name: "created_at" },
      { name: "applies_to_all_units", type: "boolean" },
    ],
  },
  lock_access_codes: {
    sheetTitle: "lock_access_codes",
    columns: [
      { name: "id" },
      { name: "reservation_id" },
      { name: "owner_block_id" },
      { name: "smart_lock_id" },
      { name: "code" },
      { name: "starts_at" },
      { name: "ends_at" },
      { name: "status" },
      { name: "external_code_id" },
      { name: "provider_payload", type: "json" },
      { name: "created_at" },
      { name: "updated_at" },
    ],
    uniqueConstraints: [
      {
        name: "lock_access_codes_live_lock_code_key",
        columns: ["smart_lock_id", "code"],
        applies: liveLockCode,
      },
    ],
  },
  turnover_checklists: {
    sheetTitle: "turnover_checklists",
    columns: [
      { name: "id" },
      { name: "unit_id" },
      { name: "turnover_date" },
      { name: "status" },
      { name: "notes" },
      { name: "created_at" },
      { name: "updated_at" },
    ],
    uniqueConstraints: [
      {
        name: "turnover_checklists_unit_date_key",
        columns: ["unit_id", "turnover_date"],
      },
    ],
  },
  ical_sync_runs: {
    sheetTitle: "ical_sync_runs",
    columns: [
      { name: "id" },
      { name: "unit_id" },
      { name: "ical_source_id" },
      { name: "source_name" },
      { name: "trigger" },
      { name: "status" },
      { name: "started_at" },
      { name: "finished_at" },
      { name: "total_events", type: "number" },
      { name: "synced", type: "number" },
      { name: "skipped", type: "number" },
      { name: "error_message" },
    ],
  },
  guest_portal_content: {
    sheetTitle: "guest_portal_content",
    columns: [
      { name: "id" },
      { name: "unit_id" },
      { name: "section_key" },
      { name: "title" },
      { name: "body" },
      { name: "sort_order", type: "number" },
      { name: "is_active", type: "boolean" },
      { name: "created_at" },
      { name: "updated_at" },
    ],
    uniqueConstraints: [
      {
        name: "guest_portal_content_unit_key",
        columns: ["unit_id", "section_key"],
      },
    ],
  },
  guest_portal_sessions: {
    sheetTitle: "guest_portal_sessions",
    columns: [
      { name: "id" },
      { name: "unit_id" },
      { name: "reservation_id" },
      { name: "access_token" },
      { name: "expires_at" },
      { name: "revoked_at" },
      { name: "created_at" },
      { name: "last_accessed_at" },
    ],
    uniqueConstraints: [
      {
        name: "guest_portal_sessions_access_token_key",
        columns: ["access_token"],
      },
      {
        name: "guest_portal_sessions_one_active_per_reservation",
        columns: ["reservation_id"],
        applies: activeGuestPortalSession,
      },
    ],
  },
  guest_portal_message_requests: {
    sheetTitle: "guest_portal_message_requests",
    columns: [
      { name: "id" },
      { name: "unit_id" },
      { name: "reservation_id" },
      { name: "session_id" },
      { name: "guest_name" },
      { name: "guest_email" },
      { name: "guest_phone" },
      { name: "message" },
      { name: "status" },
      { name: "created_at" },
      { name: "resolved_at" },
    ],
  },
  rate_limits: {
    sheetTitle: "rate_limits",
    columns: [
      { name: "id" },
      { name: "route" },
      { name: "key" },
      { name: "window_start" },
      { name: "count", type: "number" },
    ],
    uniqueConstraints: [
      {
        name: "rate_limits_route_key_key",
        columns: ["route", "key"],
      },
    ],
  },
} satisfies Record<string, SheetTableDefinition>;

export type SheetTableName = keyof typeof SHEET_TABLES;

export const SHEET_TABLE_NAMES = Object.keys(SHEET_TABLES) as SheetTableName[];

export function getTableDefinition(table: SheetTableName): SheetTableDefinition {
  return SHEET_TABLES[table];
}

export function getTableColumns(table: SheetTableName) {
  return getTableDefinition(table).columns.map((column) => column.name);
}

export function isSheetTableName(value: string): value is SheetTableName {
  return value in SHEET_TABLES;
}
