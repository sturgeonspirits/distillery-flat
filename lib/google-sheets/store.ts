import "server-only";

import { randomUUID } from "node:crypto";
import {
  batchUpdateSpreadsheet,
  clearSheetValues,
  getSheetValues,
  getSpreadsheetMetadata,
  quoteSheetName,
  updateSheetValues,
} from "@/lib/google-sheets/api";
import {
  getTableColumns,
  getTableDefinition,
  SHEET_TABLE_NAMES,
  type SheetRow,
  type SheetTableName,
  type UniqueConstraint,
} from "@/lib/google-sheets/schema";

type MutateResult<T> = {
  rows: SheetRow[];
  result: T;
};

const tableLocks = new Map<SheetTableName, Promise<void>>();
let ensureSchemaPromise: Promise<void> | null = null;

function columnLetter(index: number) {
  let value = index + 1;
  let output = "";

  while (value > 0) {
    const remainder = (value - 1) % 26;
    output = String.fromCharCode(65 + remainder) + output;
    value = Math.floor((value - 1) / 26);
  }

  return output;
}

function tableRange(table: SheetTableName, startRow = 1) {
  const definition = getTableDefinition(table);
  const lastColumn = columnLetter(definition.columns.length - 1);

  return `${quoteSheetName(definition.sheetTitle)}!A${startRow}:${lastColumn}`;
}

function fullTableRange(table: SheetTableName) {
  const definition = getTableDefinition(table);
  const lastColumn = columnLetter(definition.columns.length - 1);

  return `${quoteSheetName(definition.sheetTitle)}!A1:${lastColumn}`;
}

function isBlank(value: unknown) {
  return value === undefined || value === null || value === "";
}

function isBlankRow(cells: unknown[]) {
  return cells.every((cell) => isBlank(cell));
}

function parseBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  const normalized = String(value).trim().toLowerCase();

  return normalized === "true" || normalized === "yes" || normalized === "1";
}

function parseCell(table: SheetTableName, columnName: string, value: unknown) {
  if (isBlank(value)) return null;

  const column = getTableDefinition(table).columns.find(
    (item) => item.name === columnName,
  );

  if (column?.type === "number") {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }

  if (column?.type === "boolean") {
    return parseBoolean(value);
  }

  if (column?.type === "json") {
    if (typeof value !== "string") return value;

    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  return String(value);
}

function serializeCell(value: unknown) {
  if (isBlank(value)) return "";

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "boolean") {
    return value ? "TRUE" : "FALSE";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return value;
}

function parseRow(table: SheetTableName, cells: unknown[]): SheetRow {
  const columns = getTableColumns(table);
  const row: SheetRow = {};

  columns.forEach((columnName, index) => {
    row[columnName] = parseCell(table, columnName, cells[index]);
  });

  return row;
}

function serializeRow(table: SheetTableName, row: SheetRow) {
  return getTableColumns(table).map((columnName) =>
    serializeCell(row[columnName]),
  );
}

function normalizeToTableColumns(table: SheetTableName, row: SheetRow) {
  const normalized: SheetRow = {};

  for (const columnName of getTableColumns(table)) {
    normalized[columnName] = row[columnName] ?? null;
  }

  return normalized;
}

function setIfMissing(row: SheetRow, key: string, value: unknown) {
  if (isBlank(row[key])) {
    row[key] = value;
  }
}

function applyInsertDefaults(table: SheetTableName, input: SheetRow) {
  const now = new Date().toISOString();
  const row = normalizeToTableColumns(table, input);
  const columns = getTableColumns(table);

  if (columns.includes("id")) {
    setIfMissing(
      row,
      "id",
      table === "rate_limits" && row.route && row.key
        ? `${row.route}:${row.key}`
        : randomUUID(),
    );
  }

  if (columns.includes("created_at")) setIfMissing(row, "created_at", now);
  if (columns.includes("updated_at")) setIfMissing(row, "updated_at", now);
  if (columns.includes("started_at")) setIfMissing(row, "started_at", now);

  switch (table) {
    case "reservations":
      setIfMissing(row, "external_channel", null);
      setIfMissing(row, "external_reservation_id", null);
      setIfMissing(row, "imported_at", null);
      setIfMissing(row, "last_synced_at", null);
      setIfMissing(row, "source_last_seen_at", null);
      setIfMissing(row, "source_missing_since", null);
      setIfMissing(row, "reconciliation_status", null);
      setIfMissing(row, "raw_import", null);
      break;
    case "pricing_rules":
      setIfMissing(row, "min_stay", 1);
      setIfMissing(row, "priority", 1);
      break;
    case "ical_sources":
      setIfMissing(row, "is_active", true);
      setIfMissing(row, "last_synced_at", null);
      setIfMissing(row, "last_sync_status", null);
      setIfMissing(row, "last_error", null);
      setIfMissing(row, "last_result", null);
      break;
    case "smart_locks":
      setIfMissing(row, "is_active", true);
      setIfMissing(row, "external_lock_id", null);
      setIfMissing(row, "applies_to_all_units", false);
      break;
    case "lock_access_codes":
      setIfMissing(row, "reservation_id", null);
      setIfMissing(row, "owner_block_id", null);
      setIfMissing(row, "status", "pending");
      setIfMissing(row, "external_code_id", null);
      setIfMissing(row, "provider_payload", null);
      break;
    case "turnover_checklists":
      setIfMissing(row, "status", "not_started");
      setIfMissing(row, "notes", null);
      break;
    case "ical_sync_runs":
      setIfMissing(row, "status", "running");
      setIfMissing(row, "finished_at", null);
      setIfMissing(row, "total_events", 0);
      setIfMissing(row, "synced", 0);
      setIfMissing(row, "skipped", 0);
      setIfMissing(row, "error_message", null);
      break;
    case "guest_portal_content":
      setIfMissing(row, "sort_order", 100);
      setIfMissing(row, "is_active", true);
      break;
    case "guest_portal_sessions":
      setIfMissing(row, "expires_at", null);
      setIfMissing(row, "revoked_at", null);
      setIfMissing(row, "last_accessed_at", null);
      break;
    case "guest_portal_message_requests":
      setIfMissing(row, "guest_email", null);
      setIfMissing(row, "guest_phone", null);
      setIfMissing(row, "status", "new");
      setIfMissing(row, "resolved_at", null);
      break;
    case "rate_limits":
      setIfMissing(row, "window_start", now);
      setIfMissing(row, "count", 0);
      break;
    default:
      break;
  }

  return row;
}

function isConstraintApplicable(row: SheetRow, constraint: UniqueConstraint) {
  if (constraint.applies && !constraint.applies(row)) return false;

  return constraint.columns.every((column) => !isBlank(row[column]));
}

function uniqueKey(row: SheetRow, columns: string[]) {
  return columns.map((column) => String(row[column])).join("\u0000");
}

function makeUniqueError(name: string) {
  const error = new Error(
    `duplicate key value violates unique constraint "${name}"`,
  ) as Error & { code?: string };

  error.code = "23505";
  return error;
}

function validateUniqueRows(table: SheetTableName, rows: SheetRow[]) {
  const definition = getTableDefinition(table);
  const constraints: UniqueConstraint[] = [...(definition.uniqueConstraints ?? [])];

  if (getTableColumns(table).includes("id")) {
    constraints.push({
      name: `${table}_id_key`,
      columns: ["id"],
    });
  }

  for (const constraint of constraints) {
    const seen = new Map<string, number>();

    rows.forEach((row, index) => {
      if (!isConstraintApplicable(row, constraint)) return;

      const key = uniqueKey(row, constraint.columns);

      if (seen.has(key)) {
        throw makeUniqueError(constraint.name);
      }

      seen.set(key, index);
    });
  }
}

async function ensureSheetSchemaInternal() {
  const metadata = await getSpreadsheetMetadata();
  const existingTitles = new Set(
    (metadata.sheets ?? [])
      .map((sheet) => sheet.properties?.title)
      .filter((title): title is string => Boolean(title)),
  );
  const requests = SHEET_TABLE_NAMES.filter(
    (table) => !existingTitles.has(getTableDefinition(table).sheetTitle),
  ).map((table) => ({
    addSheet: {
      properties: {
        title: getTableDefinition(table).sheetTitle,
      },
    },
  }));

  await batchUpdateSpreadsheet(requests);

  await Promise.all(
    SHEET_TABLE_NAMES.map((table) =>
      updateSheetValues(tableRange(table, 1), [getTableColumns(table)]),
    ),
  );
}

export async function ensureSheetSchema() {
  ensureSchemaPromise ??= ensureSheetSchemaInternal();
  await ensureSchemaPromise;
}

export async function readTableRows(table: SheetTableName) {
  await ensureSheetSchema();

  const values = await getSheetValues(fullTableRange(table));
  const bodyRows = values.slice(1).filter((cells) => !isBlankRow(cells));

  return bodyRows.map((cells) => parseRow(table, cells));
}

export async function replaceTableRows(
  table: SheetTableName,
  rows: SheetRow[],
) {
  await ensureSheetSchema();
  validateUniqueRows(table, rows);

  await clearSheetValues(tableRange(table, 2));

  if (rows.length > 0) {
    await updateSheetValues(tableRange(table, 2), rows.map((row) => serializeRow(table, row)));
  }
}

export async function mutateTableRows<T>(
  table: SheetTableName,
  callback: (rows: SheetRow[]) => Promise<MutateResult<T>> | MutateResult<T>,
) {
  const previousLock = tableLocks.get(table) ?? Promise.resolve();
  let releaseLock: () => void;
  const lock = new Promise<void>((resolve) => {
    releaseLock = resolve;
  });
  const nextLock = previousLock.catch(() => undefined).then(() => lock);

  tableLocks.set(table, nextLock);

  await previousLock.catch(() => undefined);

  try {
    const rows = await readTableRows(table);
    const { rows: nextRows, result } = await callback(rows);

    await replaceTableRows(table, nextRows);

    return result;
  } finally {
    releaseLock!();

    if (tableLocks.get(table) === nextLock) {
      tableLocks.delete(table);
    }
  }
}

export function withInsertDefaults(table: SheetTableName, row: SheetRow) {
  return applyInsertDefaults(table, row);
}
