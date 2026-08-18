import "server-only";

import {
  createSessionForUser,
  deleteSession,
  getCurrentSessionUser,
  verifyPasswordCredentials,
  type AppUser,
} from "@/lib/session-auth";
import {
  mutateTableRows,
  readTableRows,
  withInsertDefaults,
} from "@/lib/google-sheets/store";
import {
  isSheetTableName,
  type SheetRow,
  type SheetTableName,
} from "@/lib/google-sheets/schema";

type SheetsError = {
  message: string;
  code?: string;
  details?: string | null;
  hint?: string | null;
};

type QueryResponse<TData = SheetRow[]> = {
  data: TData | null;
  error: SheetsError | null;
};

type FilterOperator = "eq" | "neq" | "lt" | "gt" | "is" | "in";

type QueryFilter = {
  column: string;
  operator: FilterOperator;
  value: unknown;
};

type QueryOrder = {
  column: string;
  ascending: boolean;
};

type QueryOperation = "select" | "insert" | "update" | "delete" | "upsert";

function toSheetsError(error: unknown): SheetsError {
  if (error instanceof Error) {
    return {
      message: error.message,
      code:
        "code" in error && typeof error.code === "string"
          ? error.code
          : undefined,
    };
  }

  if (error && typeof error === "object" && "message" in error) {
    return {
      message: String((error as { message: unknown }).message),
    };
  }

  return {
    message: "Unknown Google Sheets backend error.",
  };
}

function parseSelectedColumns(columns?: string) {
  if (!columns || columns.trim() === "*") {
    return null;
  }

  return columns
    .split(",")
    .map((column) => column.trim())
    .filter(Boolean);
}

function hasValue(value: unknown) {
  return value !== undefined && value !== null && value !== "";
}

function valuesEqual(a: unknown, b: unknown) {
  if (!hasValue(a) && !hasValue(b)) return true;
  if (!hasValue(a) || !hasValue(b)) return false;

  return String(a) === String(b);
}

function compareValues(a: unknown, b: unknown) {
  if (!hasValue(a) && !hasValue(b)) return 0;
  if (!hasValue(a)) return 1;
  if (!hasValue(b)) return -1;

  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }

  return String(a).localeCompare(String(b));
}

function applyFilters(rows: SheetRow[], filters: QueryFilter[]) {
  return rows.filter((row) =>
    filters.every((filter) => {
      const value = row[filter.column];

      switch (filter.operator) {
        case "eq":
          return valuesEqual(value, filter.value);
        case "neq":
          return !valuesEqual(value, filter.value);
        case "lt":
          return compareValues(value, filter.value) < 0;
        case "gt":
          return compareValues(value, filter.value) > 0;
        case "is":
          return filter.value === null ? !hasValue(value) : valuesEqual(value, filter.value);
        case "in":
          return Array.isArray(filter.value)
            ? filter.value.some((item) => valuesEqual(value, item))
            : false;
        default:
          return true;
      }
    }),
  );
}

function applyOrders(rows: SheetRow[], orders: QueryOrder[]) {
  if (orders.length === 0) return rows;

  return [...rows].sort((a, b) => {
    for (const order of orders) {
      const comparison = compareValues(a[order.column], b[order.column]);

      if (comparison !== 0) {
        return order.ascending ? comparison : -comparison;
      }
    }

    return 0;
  });
}

function projectRows(rows: SheetRow[], selectedColumns?: string[] | null) {
  if (selectedColumns === undefined || selectedColumns === null) {
    return rows.map((row) => ({ ...row }));
  }

  return rows.map((row) => {
    const projected: SheetRow = {};

    selectedColumns.forEach((column) => {
      projected[column] = row[column] ?? null;
    });

    return projected;
  });
}

function normalizePayloadRows(payload: SheetRow | SheetRow[]) {
  return Array.isArray(payload) ? payload : [payload];
}

function findConflictIndex(
  rows: SheetRow[],
  payload: SheetRow,
  conflictColumns: string[],
) {
  if (conflictColumns.some((column) => !hasValue(payload[column]))) {
    return -1;
  }

  return rows.findIndex((row) =>
    conflictColumns.every((column) => valuesEqual(row[column], payload[column])),
  );
}

function defaultConflictColumns(table: SheetTableName, payload: SheetRow) {
  if ("id" in payload && hasValue(payload.id)) return ["id"];
  if (table === "pricing_settings") return ["unit_id"];
  if (table === "guest_portal_content") return ["unit_id", "section_key"];
  if (table === "turnover_checklists") return ["unit_id", "turnover_date"];
  if (table === "rate_limits") return ["route", "key"];

  return ["id"];
}

function parseConflictColumns(options?: { onConflict?: string }) {
  if (!options?.onConflict) return null;

  return options.onConflict
    .split(",")
    .map((column) => column.trim())
    .filter(Boolean);
}

function maybeSetUpdatedAt(row: SheetRow, payload: SheetRow) {
  if ("updated_at" in row && payload.updated_at === undefined) {
    row.updated_at = new Date().toISOString();
  }

  return row;
}

function createAuthApi() {
  return {
    async getUser(): Promise<{
      data: { user: AppUser | null };
      error: SheetsError | null;
    }> {
      return {
        data: {
          user: await getCurrentSessionUser(),
        },
        error: null,
      };
    },

    async signInWithPassword(input: {
      email: string;
      password: string;
    }): Promise<{
      data: { user: AppUser | null };
      error: SheetsError | null;
    }> {
      try {
        if (!verifyPasswordCredentials(input)) {
          return {
            data: { user: null },
            error: { message: "Invalid email or password." },
          };
        }

        await createSessionForUser(input.email.trim().toLowerCase());

        return {
          data: {
            user: {
              id: "admin",
              email: input.email.trim().toLowerCase(),
            },
          },
          error: null,
        };
      } catch (error) {
        return {
          data: { user: null },
          error: toSheetsError(error),
        };
      }
    },

    async signOut() {
      await deleteSession();

      return {
        error: null,
      };
    },
  };
}

class SheetsQueryBuilder<TData = SheetRow[]>
  implements PromiseLike<QueryResponse<TData>>
{
  private operation: QueryOperation = "select";
  private filters: QueryFilter[] = [];
  private orders: QueryOrder[] = [];
  private rowLimit: number | null = null;
  private selectedColumns: string[] | null | undefined;
  private payloadRows: SheetRow[] = [];
  private updatePayload: SheetRow = {};
  private singleMode: "single" | "maybeSingle" | null = null;
  private conflictColumns: string[] | null = null;

  constructor(private readonly table: SheetTableName) {}

  select(columns = "*"): SheetsQueryBuilder<SheetRow[]> {
    this.selectedColumns = parseSelectedColumns(columns);
    return this as unknown as SheetsQueryBuilder<SheetRow[]>;
  }

  insert(payload: SheetRow | SheetRow[]) {
    this.operation = "insert";
    this.payloadRows = normalizePayloadRows(payload);
    return this;
  }

  update(payload: SheetRow) {
    this.operation = "update";
    this.updatePayload = payload;
    return this;
  }

  delete() {
    this.operation = "delete";
    return this;
  }

  upsert(payload: SheetRow | SheetRow[], options?: { onConflict?: string }) {
    this.operation = "upsert";
    this.payloadRows = normalizePayloadRows(payload);
    this.conflictColumns = parseConflictColumns(options);
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ column, operator: "eq", value });
    return this;
  }

  neq(column: string, value: unknown) {
    this.filters.push({ column, operator: "neq", value });
    return this;
  }

  lt(column: string, value: unknown) {
    this.filters.push({ column, operator: "lt", value });
    return this;
  }

  gt(column: string, value: unknown) {
    this.filters.push({ column, operator: "gt", value });
    return this;
  }

  is(column: string, value: unknown) {
    this.filters.push({ column, operator: "is", value });
    return this;
  }

  in(column: string, value: unknown[]) {
    this.filters.push({ column, operator: "in", value });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orders.push({
      column,
      ascending: options?.ascending ?? true,
    });
    return this;
  }

  limit(limit: number) {
    this.rowLimit = limit;
    return this;
  }

  single(): SheetsQueryBuilder<SheetRow> {
    this.singleMode = "single";
    return this as unknown as SheetsQueryBuilder<SheetRow>;
  }

  maybeSingle(): SheetsQueryBuilder<SheetRow | null> {
    this.singleMode = "maybeSingle";
    return this as unknown as SheetsQueryBuilder<SheetRow | null>;
  }

  then<TResult1 = QueryResponse<TData>, TResult2 = never>(
    onfulfilled?:
      | ((value: QueryResponse<TData>) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return this.execute().then(onfulfilled, onrejected);
  }

  private async execute(): Promise<QueryResponse<TData>> {
    try {
      switch (this.operation) {
        case "insert":
          return this.executeInsert() as Promise<QueryResponse<TData>>;
        case "update":
          return this.executeUpdate() as Promise<QueryResponse<TData>>;
        case "delete":
          return this.executeDelete() as Promise<QueryResponse<TData>>;
        case "upsert":
          return this.executeUpsert() as Promise<QueryResponse<TData>>;
        case "select":
        default:
          return this.executeSelect() as Promise<QueryResponse<TData>>;
      }
    } catch (error) {
      return {
        data: null,
        error: toSheetsError(error),
      };
    }
  }

  private shapeRows(rows: SheetRow[], shouldReturnRows: boolean) {
    if (!shouldReturnRows) {
      return {
        data: null,
        error: null,
      };
    }

    const projectedRows = projectRows(rows, this.selectedColumns);

    if (this.singleMode === "single") {
      if (projectedRows.length !== 1) {
        return {
          data: null,
          error: {
            message: `Expected exactly one row from ${this.table}, got ${projectedRows.length}.`,
          },
        };
      }

      return {
        data: projectedRows[0],
        error: null,
      };
    }

    if (this.singleMode === "maybeSingle") {
      if (projectedRows.length === 0) {
        return {
          data: null,
          error: null,
        };
      }

      if (projectedRows.length > 1) {
        return {
          data: null,
          error: {
            message: `Expected zero or one row from ${this.table}, got ${projectedRows.length}.`,
          },
        };
      }

      return {
        data: projectedRows[0],
        error: null,
      };
    }

    return {
      data: projectedRows,
      error: null,
    };
  }

  private async executeSelect() {
    const rows = await readTableRows(this.table);
    const filteredRows = applyOrders(applyFilters(rows, this.filters), this.orders);
    const limitedRows =
      this.rowLimit === null ? filteredRows : filteredRows.slice(0, this.rowLimit);

    return this.shapeRows(limitedRows, true);
  }

  private async executeInsert() {
    const insertedRows = this.payloadRows.map((row) =>
      withInsertDefaults(this.table, row),
    );
    const result = await mutateTableRows(this.table, (rows) => ({
      rows: [...rows, ...insertedRows],
      result: insertedRows,
    }));

    return this.shapeRows(result, this.selectedColumns !== undefined);
  }

  private async executeUpdate() {
    const result = await mutateTableRows(this.table, (rows) => {
      const affectedRows: SheetRow[] = [];
      const nextRows = rows.map((row) => {
        if (!applyFilters([row], this.filters).length) {
          return row;
        }

        const nextRow = maybeSetUpdatedAt(
          {
            ...row,
            ...this.updatePayload,
          },
          this.updatePayload,
        );

        affectedRows.push(nextRow);
        return nextRow;
      });

      return {
        rows: nextRows,
        result: affectedRows,
      };
    });

    return this.shapeRows(result, this.selectedColumns !== undefined);
  }

  private async executeDelete() {
    await mutateTableRows(this.table, (rows) => ({
      rows: rows.filter((row) => !applyFilters([row], this.filters).length),
      result: null,
    }));

    return {
      data: null,
      error: null,
    };
  }

  private async executeUpsert() {
    const result = await mutateTableRows(this.table, (rows) => {
      const affectedRows: SheetRow[] = [];
      const nextRows = [...rows];

      for (const payload of this.payloadRows) {
        const conflictColumns =
          this.conflictColumns ?? defaultConflictColumns(this.table, payload);
        const existingIndex = findConflictIndex(nextRows, payload, conflictColumns);

        if (existingIndex >= 0) {
          const updatedRow = maybeSetUpdatedAt(
            {
              ...nextRows[existingIndex],
              ...payload,
            },
            payload,
          );

          nextRows[existingIndex] = updatedRow;
          affectedRows.push(updatedRow);
          continue;
        }

        const insertedRow = withInsertDefaults(this.table, payload);
        nextRows.push(insertedRow);
        affectedRows.push(insertedRow);
      }

      return {
        rows: nextRows,
        result: affectedRows,
      };
    });

    return this.shapeRows(result, this.selectedColumns !== undefined);
  }
}

async function consumeRateLimit(args: {
  p_route: string;
  p_key: string;
  p_window_seconds: number;
  p_limit: number;
}) {
  const now = new Date();
  const result = await mutateTableRows("rate_limits", (rows) => {
    const existingIndex = rows.findIndex(
      (row) => row.route === args.p_route && row.key === args.p_key,
    );
    const existing = existingIndex >= 0 ? rows[existingIndex] : null;
    const windowStart = existing?.window_start
      ? new Date(String(existing.window_start))
      : null;
    const elapsedSeconds = windowStart
      ? Math.floor((now.getTime() - windowStart.getTime()) / 1000)
      : args.p_window_seconds + 1;
    const resetWindow = !windowStart || elapsedSeconds >= args.p_window_seconds;
    const count = resetWindow ? 1 : Number(existing?.count ?? 0) + 1;
    const allowed = count <= args.p_limit;
    const retryAfterSeconds = allowed
      ? 0
      : Math.max(1, args.p_window_seconds - elapsedSeconds);
    const nextRow = withInsertDefaults("rate_limits", {
      id: existing?.id ?? `${args.p_route}:${args.p_key}`,
      route: args.p_route,
      key: args.p_key,
      window_start: resetWindow
        ? now.toISOString()
        : existing?.window_start ?? now.toISOString(),
      count,
    });
    const nextRows = [...rows];

    if (existingIndex >= 0) {
      nextRows[existingIndex] = nextRow;
    } else {
      nextRows.push(nextRow);
    }

    return {
      rows: nextRows,
      result: {
        allowed,
        count,
        retry_after_seconds: retryAfterSeconds,
      },
    };
  });

  return result;
}

export function createSheetsClient() {
  return {
    auth: createAuthApi(),
    from(table: string) {
      if (!isSheetTableName(table)) {
        throw new Error(`Unknown Google Sheets table: ${table}`);
      }

      return new SheetsQueryBuilder(table);
    },
    async rpc(name: string, args: Record<string, unknown>) {
      try {
        if (name !== "consume_rate_limit") {
          throw new Error(`Unsupported Google Sheets RPC: ${name}`);
        }

        return {
          data: await consumeRateLimit({
            p_route: String(args.p_route),
            p_key: String(args.p_key),
            p_window_seconds: Number(args.p_window_seconds),
            p_limit: Number(args.p_limit),
          }),
          error: null,
        };
      } catch (error) {
        return {
          data: null,
          error: toSheetsError(error),
        };
      }
    },
  };
}

export async function createClient() {
  return createSheetsClient();
}

export const sheetsAdmin = createSheetsClient();
export const supabaseAdmin = sheetsAdmin;
