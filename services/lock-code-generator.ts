import { randomInt } from "node:crypto";
import type { Reservation } from "@/types/reservation";
import { getActiveSmartLocks } from "@/services/locks";
import {
  createLockAccessCode,
  deleteLockAccessCode,
  getLockAccessCodeById,
  getLockAccessCodesByReservation,
  revokeLockAccessCode,
} from "@/services/lock-access-codes";

const PROPERTY_TIME_ZONE = "America/Chicago";
const CHECK_IN_HOUR = 15;
const CHECK_OUT_HOUR = 11;
const ACCESS_CODE_LENGTH = 4;
const MAX_UNIQUE_CODE_ATTEMPTS = 50;
const UNIQUE_VIOLATION_CODE = "23505";

function parseDateParts(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);

  if (!year || !month || !day) {
    throw new Error(`Invalid date string: ${dateStr}`);
  }

  return { year, month, day };
}

function getOffsetMinutesForTimeZone(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
  });

  const timeZoneName = formatter
    .formatToParts(date)
    .find((part) => part.type === "timeZoneName")?.value;

  const match = timeZoneName?.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/i);

  if (!match) {
    throw new Error(
      `Could not determine timezone offset for ${timeZone} at ${date.toISOString()}.`,
    );
  }

  const sign = match[1] === "-" ? -1 : 1;
  const hours = Number(match[2] || 0);
  const minutes = Number(match[3] || 0);

  return sign * (hours * 60 + minutes);
}

function zonedLocalToUtcIso(
  dateStr: string,
  hour: number,
  minute: number,
  timeZone: string,
) {
  const { year, month, day } = parseDateParts(dateStr);

  let utcMillis = Date.UTC(year, month - 1, day, hour, minute, 0);

  for (let i = 0; i < 2; i += 1) {
    const offsetMinutes = getOffsetMinutesForTimeZone(
      new Date(utcMillis),
      timeZone,
    );

    utcMillis =
      Date.UTC(year, month - 1, day, hour, minute, 0) -
      offsetMinutes * 60 * 1000;
  }

  return new Date(utcMillis).toISOString();
}

function generateNumericAccessCode(length = ACCESS_CODE_LENGTH) {
  if (length < 4) {
    throw new Error("Access code length must be at least 4.");
  }

  let output = String(randomInt(1, 10));

  for (let i = 1; i < length; i += 1) {
    output += String(randomInt(0, 10));
  }

  return output;
}

function isLiveCodeStatus(status: string) {
  return status === "pending" || status === "active";
}

function isUniqueViolation(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code =
    "code" in error && typeof (error as { code?: unknown }).code === "string"
      ? (error as { code: string }).code
      : null;

  if (code === UNIQUE_VIOLATION_CODE) {
    return true;
  }

  const message =
    error instanceof Error
      ? error.message
      : "message" in error &&
          typeof (error as { message?: unknown }).message === "string"
        ? String((error as { message: string }).message)
        : "";

  return /duplicate key value|unique constraint|violates unique/i.test(message);
}

async function createBatchForLocksWithUniqueCode(input: {
  reservation_id?: string | null;
  owner_block_id?: string | null;
  smart_lock_ids: string[];
  starts_at: string;
  ends_at: string;
}): Promise<{ created: number; code: string }> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < MAX_UNIQUE_CODE_ATTEMPTS; attempt += 1) {
    const code = generateNumericAccessCode();
    const createdIds: string[] = [];

    try {
      for (const smart_lock_id of input.smart_lock_ids) {
        const created = await createLockAccessCode({
          reservation_id: input.reservation_id ?? null,
          owner_block_id: input.owner_block_id ?? null,
          smart_lock_id,
          code,
          starts_at: input.starts_at,
          ends_at: input.ends_at,
          status: "pending",
        });

        createdIds.push(created.id);
      }

      return {
        created: input.smart_lock_ids.length,
        code,
      };
    } catch (error) {
      lastError = error;

      await Promise.allSettled(createdIds.map((id) => deleteLockAccessCode(id)));

      if (!isUniqueViolation(error)) {
        throw error;
      }
    }
  }

  throw new Error(
    lastError instanceof Error
      ? `Could not generate a unique lock access code. ${lastError.message}`
      : "Could not generate a unique lock access code.",
  );
}

async function createSingleLockCodeWithUniqueCode(input: {
  reservation_id?: string | null;
  owner_block_id?: string | null;
  smart_lock_id: string;
  starts_at: string;
  ends_at: string;
}) {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < MAX_UNIQUE_CODE_ATTEMPTS; attempt += 1) {
    try {
      return await createLockAccessCode({
        reservation_id: input.reservation_id ?? null,
        owner_block_id: input.owner_block_id ?? null,
        smart_lock_id: input.smart_lock_id,
        code: generateNumericAccessCode(),
        starts_at: input.starts_at,
        ends_at: input.ends_at,
        status: "pending",
      });
    } catch (error) {
      lastError = error;

      if (!isUniqueViolation(error)) {
        throw error;
      }
    }
  }

  throw new Error(
    lastError instanceof Error
      ? `Could not generate a unique lock access code. ${lastError.message}`
      : "Could not generate a unique lock access code.",
  );
}

export async function createPendingLockCodesForReservation(
  reservation: Reservation,
): Promise<{ created: number; code: string | null }> {
  if (reservation.status !== "confirmed") {
    return { created: 0, code: null };
  }

  const activeLocks = await getActiveSmartLocks(reservation.unit_id);

  if (activeLocks.length === 0) {
    return { created: 0, code: null };
  }

  const existingForReservation = await getLockAccessCodesByReservation(
    reservation.id,
  );

  const existingLiveCodes = existingForReservation.filter((item) =>
    isLiveCodeStatus(item.status),
  );

  if (existingLiveCodes.length > 0) {
    return {
      created: 0,
      code: existingLiveCodes[0]?.code ?? null,
    };
  }

  const starts_at = zonedLocalToUtcIso(
    reservation.check_in,
    CHECK_IN_HOUR,
    0,
    PROPERTY_TIME_ZONE,
  );

  const ends_at = zonedLocalToUtcIso(
    reservation.check_out,
    CHECK_OUT_HOUR,
    0,
    PROPERTY_TIME_ZONE,
  );

  return createBatchForLocksWithUniqueCode({
    reservation_id: reservation.id,
    smart_lock_ids: activeLocks.map((lock) => lock.id),
    starts_at,
    ends_at,
  });
}

export async function regenerateLockAccessCode(codeId: string) {
  const existing = await getLockAccessCodeById(codeId);

  const replacement = await createSingleLockCodeWithUniqueCode({
    reservation_id: existing.reservation_id,
    owner_block_id: existing.owner_block_id,
    smart_lock_id: existing.smart_lock_id,
    starts_at: existing.starts_at,
    ends_at: existing.ends_at,
  });

  if (isLiveCodeStatus(existing.status)) {
    await revokeLockAccessCode(existing.id);
  }

  return replacement;
}

export async function resetLockCodesForReservation(reservation: Reservation) {
  const existingCodes = await getLockAccessCodesByReservation(reservation.id);

  await Promise.all(
    existingCodes
      .filter((code) => isLiveCodeStatus(code.status))
      .map((code) => revokeLockAccessCode(code.id)),
  );

  if (reservation.status === "confirmed") {
    return createPendingLockCodesForReservation(reservation);
  }

  return { created: 0, code: null };
}