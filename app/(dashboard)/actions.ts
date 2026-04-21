"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { assertUnitIsAvailable } from "@/services/availability";
import { assertStayMeetsMinimum } from "@/services/booking-pricing";
import {
  getDefaultNightlyRateForDate,
  getPricingSnapshot,
} from "@/services/pricing";
import { upsertPricingSettings } from "@/services/pricing-settings";
import {
  createReservation,
  deleteReservation,
  getReservationById,
  updateReservation,
  markReservationManualOverride,
  clearReservationMissingOnSource,
} from "@/services/reservations";
import {
  createPendingLockCodesForReservation,
  regenerateLockAccessCode,
  resetLockCodesForReservation,
} from "@/services/lock-code-generator";
import { revokeLockAccessCode } from "@/services/lock-access-codes";
import {
  createOwnerBlock,
  deleteOwnerBlock,
  getOwnerBlockById,
  updateOwnerBlock,
} from "@/services/owner-blocks";
import { createPricingRule, deletePricingRule } from "@/services/pricing-rules";
import { createIcalSource, deleteIcalSource } from "@/services/ical-sources";
import {
  syncAllActiveIcalSources,
  syncIcalSourceWithMonitoring,
} from "@/services/ical-sync-runner";
import { createSmartLock, deleteSmartLock } from "@/services/locks";
import { upsertTurnoverChecklist } from "@/services/turnovers";

const UNIT_ID = "cdd0a039-ef0a-44b5-a68d-339866029d42";

type FormActionState = {
  ok: boolean;
  error: string | null;
};

export async function createReservationAction(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  await requireUser();

  try {
    const guest_name = String(formData.get("guest_name") || "").trim();
    const channel = String(formData.get("channel") || "Manual") as
      | "Airbnb"
      | "Vrbo"
      | "Manual"
      | "iCal";
    const check_in = String(formData.get("check_in") || "");
    const check_out = String(formData.get("check_out") || "");
    const status = String(formData.get("status") || "confirmed") as
      | "inquiry"
      | "confirmed"
      | "checked_in"
      | "checked_out"
      | "cancelled";
    const guest_count = Number(formData.get("guest_count") || 1);
    const submitted_nightly_rate = Number(formData.get("nightly_rate") || 0);
    const cleaningFeeValue = String(formData.get("cleaning_fee") ?? "").trim();

    if (!guest_name) {
      return { ok: false, error: "Guest name is required." };
    }

    await assertUnitIsAvailable({
      unit_id: UNIT_ID,
      start_date: check_in,
      end_date: check_out,
    });

    const pricing = await assertStayMeetsMinimum(check_in, check_out);
    const pricingSnapshot = await getPricingSnapshot();
    const defaultNightlyRate = getDefaultNightlyRateForDate(
      check_in,
      pricingSnapshot,
    );

    const nightly_rate =
      pricing.nightly_rate > 0
        ? pricing.nightly_rate
        : submitted_nightly_rate > 0
          ? submitted_nightly_rate
          : defaultNightlyRate;

    const cleaning_fee =
      cleaningFeeValue === ""
        ? pricingSnapshot.cleaningFee
        : Number(cleaningFeeValue);

    if (nightly_rate <= 0) {
      return {
        ok: false,
        error:
          "No nightly rate found for this stay. Add a pricing rule or set a valid base rate.",
      };
    }

    if (!Number.isFinite(cleaning_fee) || cleaning_fee < 0) {
      return {
        ok: false,
        error: "Cleaning fee must be 0 or greater.",
      };
    }

    const reservation = await createReservation({
      unit_id: UNIT_ID,
      guest_name,
      channel,
      check_in,
      check_out,
      status,
      guest_count,
      nightly_rate,
      cleaning_fee,
      applied_pricing_rule_id: pricing.rule?.id ?? null,
      applied_min_stay: pricing.min_stay,
    });

    if (reservation.status === "confirmed") {
      await createPendingLockCodesForReservation(reservation);
    }

    revalidatePath("/dashboard");
    revalidatePath("/reservations");
    revalidatePath("/reports");
    revalidatePath("/calendar");
    revalidatePath("/operations");

    return { ok: true, error: null };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Could not create reservation.",
    };
  }
}

export async function updateReservationAction(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  await requireUser();

  try {
    const id = String(formData.get("id") || "");
    const guest_name = String(formData.get("guest_name") || "").trim();
    const channel = String(formData.get("channel") || "Manual") as
      | "Airbnb"
      | "Vrbo"
      | "Manual"
      | "iCal";
    const check_in = String(formData.get("check_in") || "");
    const check_out = String(formData.get("check_out") || "");
    const status = String(formData.get("status") || "confirmed") as
      | "inquiry"
      | "confirmed"
      | "checked_in"
      | "checked_out"
      | "cancelled";
    const guest_count = Number(formData.get("guest_count") || 1);
    const submitted_nightly_rate = Number(formData.get("nightly_rate") || 0);
    const cleaningFeeValue = String(formData.get("cleaning_fee") ?? "").trim();

    if (!id) {
      return { ok: false, error: "Reservation id is required." };
    }

    if (!guest_name) {
      return { ok: false, error: "Guest name is required." };
    }

    const existing = await getReservationById(id);

    await assertUnitIsAvailable({
      unit_id: existing.unit_id,
      start_date: check_in,
      end_date: check_out,
      exclude_reservation_id: id,
    });

    const pricing = await assertStayMeetsMinimum(check_in, check_out);
    const pricingSnapshot = await getPricingSnapshot();
    const defaultNightlyRate = getDefaultNightlyRateForDate(
      check_in,
      pricingSnapshot,
    );

    const nightly_rate =
      pricing.nightly_rate > 0
        ? pricing.nightly_rate
        : submitted_nightly_rate > 0
          ? submitted_nightly_rate
          : defaultNightlyRate;

    const cleaning_fee =
      cleaningFeeValue === ""
        ? pricingSnapshot.cleaningFee
        : Number(cleaningFeeValue);

    if (nightly_rate <= 0) {
      return {
        ok: false,
        error:
          "No nightly rate found for this stay. Add a pricing rule or set a valid base rate.",
      };
    }

    if (!Number.isFinite(cleaning_fee) || cleaning_fee < 0) {
      return {
        ok: false,
        error: "Cleaning fee must be 0 or greater.",
      };
    }

    const reservation = await updateReservation({
      id,
      guest_name,
      channel,
      check_in,
      check_out,
      status,
      guest_count,
      nightly_rate,
      cleaning_fee,
      applied_pricing_rule_id: pricing.rule?.id ?? null,
      applied_min_stay: pricing.min_stay,
    });

    const datesChanged =
      existing.check_in !== reservation.check_in ||
      existing.check_out !== reservation.check_out;
    const statusChanged = existing.status !== reservation.status;

    if (datesChanged || statusChanged) {
      await resetLockCodesForReservation(reservation);
    }

    revalidatePath("/dashboard");
    revalidatePath("/reservations");
    revalidatePath("/reports");
    revalidatePath("/calendar");
    revalidatePath("/operations");

    return { ok: true, error: null };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Could not update reservation.",
    };
  }
}

export async function cancelReservationAction(formData: FormData) {
  await requireUser();

  const id = String(formData.get("id") || "");

  if (!id) {
    throw new Error("Reservation id is required.");
  }

  const existing = await getReservationById(id);

  const reservation = await updateReservation({
    id: existing.id,
    guest_name: existing.guest_name,
    channel: existing.channel,
    check_in: existing.check_in,
    check_out: existing.check_out,
    status: "cancelled",
    guest_count: existing.guest_count,
    nightly_rate: Number(existing.nightly_rate),
    cleaning_fee: Number(existing.cleaning_fee),
    applied_pricing_rule_id: existing.applied_pricing_rule_id,
    applied_min_stay: existing.applied_min_stay,
  });

  await resetLockCodesForReservation(reservation);

  revalidatePath("/dashboard");
  revalidatePath("/reservations");
  revalidatePath("/reports");
  revalidatePath("/calendar");
  revalidatePath("/operations");
}

export async function deleteReservationAction(formData: FormData) {
  await requireUser();

  const id = String(formData.get("id") || "");

  if (!id) {
    throw new Error("Reservation id is required.");
  }

  await deleteReservation(id);

  revalidatePath("/dashboard");
  revalidatePath("/reservations");
  revalidatePath("/reports");
  revalidatePath("/calendar");
  revalidatePath("/operations");
}

export async function markReservationManualOverrideAction(formData: FormData) {
  await requireUser();

  const reservationId = String(formData.get("reservationId") || "");

  if (!reservationId) {
    throw new Error("Reservation id is required.");
  }

  await markReservationManualOverride(reservationId);

  revalidatePath("/operations");
  revalidatePath("/reservations");
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
}

export async function clearReservationMissingOnSourceAction(formData: FormData) {
  await requireUser();

  const reservationId = String(formData.get("reservationId") || "");

  if (!reservationId) {
    throw new Error("Reservation id is required.");
  }

  await clearReservationMissingOnSource(reservationId);

  revalidatePath("/operations");
  revalidatePath("/reservations");
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
}

export async function createOwnerBlockAction(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  await requireUser();

  try {
    const title = String(formData.get("title") || "Owner Block").trim();
    const start_date = String(formData.get("start_date") || "");
    const end_date = String(formData.get("end_date") || "");
    const reason = String(formData.get("reason") || "").trim();

    await assertUnitIsAvailable({
      unit_id: UNIT_ID,
      start_date,
      end_date,
    });

    await createOwnerBlock({
      unit_id: UNIT_ID,
      title,
      start_date,
      end_date,
      reason,
    });

    revalidatePath("/calendar");
    revalidatePath("/reservations");
    revalidatePath("/dashboard");
    revalidatePath("/operations");

    return { ok: true, error: null };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Could not create owner block.",
    };
  }
}

export async function updateOwnerBlockAction(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  await requireUser();

  try {
    const id = String(formData.get("id") || "");
    const title = String(formData.get("title") || "").trim();
    const start_date = String(formData.get("start_date") || "");
    const end_date = String(formData.get("end_date") || "");
    const reason = String(formData.get("reason") || "").trim();

    if (!id) {
      return { ok: false, error: "Owner block id is required." };
    }

    if (!title) {
      return { ok: false, error: "Title is required." };
    }

    const existing = await getOwnerBlockById(id);

    await assertUnitIsAvailable({
      unit_id: existing.unit_id,
      start_date,
      end_date,
      exclude_owner_block_id: id,
    });

    await updateOwnerBlock({
      id,
      title,
      start_date,
      end_date,
      reason,
    });

    revalidatePath("/calendar");
    revalidatePath("/dashboard");
    revalidatePath("/operations");

    return { ok: true, error: null };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Could not update owner block.",
    };
  }
}

export async function deleteOwnerBlockAction(formData: FormData) {
  await requireUser();

  const id = String(formData.get("id") || "");

  if (!id) {
    throw new Error("Owner block id is required.");
  }

  await deleteOwnerBlock(id);

  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  revalidatePath("/operations");
}

export async function updatePricingSettingsAction(formData: FormData) {
  await requireUser();

  const base_weekday_rate = Number(formData.get("base_weekday_rate") || 0);
  const base_weekend_rate = Number(formData.get("base_weekend_rate") || 0);
  const distillery_premium = Number(formData.get("distillery_premium") || 0);
  const eaa_weekly_target = Number(formData.get("eaa_weekly_target") || 0);
  const cleaning_fee = Number(formData.get("cleaning_fee") || 0);
  const benchmark_monthly_rent = Number(
    formData.get("benchmark_monthly_rent") || 0,
  );

  if (base_weekday_rate <= 0) {
    throw new Error("Base weekday rate must be greater than 0.");
  }

  if (base_weekend_rate <= 0) {
    throw new Error("Base weekend rate must be greater than 0.");
  }

  if (distillery_premium < 0) {
    throw new Error("Distillery premium cannot be negative.");
  }

  if (eaa_weekly_target < 0) {
    throw new Error("EAA weekly target cannot be negative.");
  }

  if (cleaning_fee < 0) {
    throw new Error("Cleaning fee cannot be negative.");
  }

  if (benchmark_monthly_rent < 0) {
    throw new Error("Monthly benchmark cannot be negative.");
  }

  await upsertPricingSettings({
    base_weekday_rate,
    base_weekend_rate,
    distillery_premium,
    eaa_weekly_target,
    cleaning_fee,
    benchmark_monthly_rent,
  });

  revalidatePath("/pricing");
  revalidatePath("/dashboard");
  revalidatePath("/calendar");
  revalidatePath("/reservations");
  revalidatePath("/reports");
  revalidatePath("/operations");
}

export async function createPricingRuleAction(formData: FormData) {
  await requireUser();

  const name = String(formData.get("name") || "").trim();
  const start_date = String(formData.get("start_date") || "");
  const end_date = String(formData.get("end_date") || "");
  const nightly_rate = Number(formData.get("nightly_rate") || 0);
  const min_stay = Number(formData.get("min_stay") || 1);
  const priority = Number(formData.get("priority") || 1);

  if (!name) {
    throw new Error("Rule name is required.");
  }

  if (!start_date || !end_date) {
    throw new Error("Start and end dates are required.");
  }

  if (end_date < start_date) {
    throw new Error("End date must be on or after start date.");
  }

  if (nightly_rate <= 0) {
    throw new Error("Nightly rate must be greater than 0.");
  }

  if (min_stay < 1) {
    throw new Error("Minimum stay must be at least 1.");
  }

  await createPricingRule({
    name,
    start_date,
    end_date,
    nightly_rate,
    min_stay,
    priority,
  });

  revalidatePath("/pricing");
  revalidatePath("/calendar");
}

export async function deletePricingRuleAction(formData: FormData) {
  await requireUser();

  const id = String(formData.get("id") || "");

  if (!id) {
    throw new Error("Pricing rule id is required.");
  }

  await deletePricingRule(id);

  revalidatePath("/pricing");
  revalidatePath("/calendar");
}

export async function revokeLockAccessCodeAction(formData: FormData) {
  await requireUser();

  const id = String(formData.get("id") || "");

  if (!id) {
    throw new Error("Lock access code id is required.");
  }

  await revokeLockAccessCode(id);

  revalidatePath("/dashboard");
  revalidatePath("/reservations");
  revalidatePath("/settings");
  revalidatePath("/operations");
}

export async function regenerateLockAccessCodeAction(formData: FormData) {
  await requireUser();

  const id = String(formData.get("id") || "");

  if (!id) {
    throw new Error("Lock access code id is required.");
  }

  await regenerateLockAccessCode(id);

  revalidatePath("/dashboard");
  revalidatePath("/reservations");
  revalidatePath("/settings");
  revalidatePath("/operations");
}

export async function createIcalSourceAction(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  await requireUser();

  try {
    const source_name = String(formData.get("source_name") || "").trim();
    const feed_url = String(formData.get("feed_url") || "").trim();

    if (!source_name) {
      return { ok: false, error: "Source name is required." };
    }

    if (!feed_url) {
      return { ok: false, error: "Feed URL is required." };
    }

    await createIcalSource({
      unit_id: UNIT_ID,
      source_name,
      feed_url,
      is_active: true,
    });

    revalidatePath("/settings");

    return { ok: true, error: null };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Could not create iCal source.",
    };
  }
}

export async function deleteIcalSourceAction(formData: FormData) {
  await requireUser();

  const id = String(formData.get("id") || "");

  if (!id) {
    throw new Error("iCal source id is required.");
  }

  await deleteIcalSource(id);

  revalidatePath("/settings");
}

export async function syncIcalSourceAction(formData: FormData) {
  await requireUser();

  const id = String(formData.get("id") || "");

  if (!id) {
    throw new Error("iCal source id is required.");
  }

  try {
    await syncIcalSourceWithMonitoring(id, "manual");
  } finally {
    revalidatePath("/settings");
    revalidatePath("/reservations");
    revalidatePath("/calendar");
    revalidatePath("/dashboard");
    revalidatePath("/operations");
  }
}

export async function syncAllIcalSourcesAction() {
  await requireUser();

  try {
    await syncAllActiveIcalSources(UNIT_ID, "manual");
  } finally {
    revalidatePath("/settings");
    revalidatePath("/reservations");
    revalidatePath("/calendar");
    revalidatePath("/dashboard");
    revalidatePath("/operations");
  }
}

export async function createSmartLockAction(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  await requireUser();

  try {
    const name = String(formData.get("name") || "").trim();
    const provider = String(formData.get("provider") || "other").trim();
    const external_lock_id = String(
      formData.get("external_lock_id") || "",
    ).trim();

    if (!name) {
      return { ok: false, error: "Lock name is required." };
    }

    if (!provider) {
      return { ok: false, error: "Provider is required." };
    }

    await createSmartLock({
      unit_id: UNIT_ID,
      name,
      provider,
      external_lock_id: external_lock_id || null,
      is_active: true,
    });

    revalidatePath("/settings");

    return { ok: true, error: null };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Could not create smart lock.",
    };
  }
}

export async function deleteSmartLockAction(formData: FormData) {
  await requireUser();

  const id = String(formData.get("id") || "");

  if (!id) {
    throw new Error("Smart lock id is required.");
  }

  await deleteSmartLock(id);

  revalidatePath("/settings");
}

export async function saveTurnoverChecklistAction(formData: FormData) {
  await requireUser();

  const turnover_date = String(formData.get("turnoverDate") || "");
  const status = String(formData.get("status") || "not_started");
  const notes = String(formData.get("notes") || "").trim();

  if (!turnover_date) {
    throw new Error("Turnover date is required.");
  }

  if (
    status !== "not_started" &&
    status !== "in_progress" &&
    status !== "ready" &&
    status !== "issue"
  ) {
    throw new Error("Invalid turnover status.");
  }

  await upsertTurnoverChecklist({
    unit_id: UNIT_ID,
    turnover_date,
    status,
    notes: notes || null,
  });

  revalidatePath("/operations");
}