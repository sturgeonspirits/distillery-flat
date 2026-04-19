import { getProjectedRevenue, getBookedNights } from "./reservations";
import {
  getAverageBaseNightlyRate,
  getNightsNeededToBeatBenchmark,
} from "./pricing";
import type { Reservation } from "@/types/reservation";
import type { PricingSnapshot } from "@/types/pricing";

export function getBookedNightsTotal(reservations: Reservation[]): number {
  return reservations.reduce(
    (sum, reservation) => sum + getBookedNights(reservation),
    0,
  );
}

export function getBenchmarkDifference(
  reservations: Reservation[],
  benchmarkMonthlyRent: number,
): number {
  return getProjectedRevenue(reservations) - benchmarkMonthlyRent;
}

export function getDashboardMetrics(
  reservations: Reservation[],
  pricing: PricingSnapshot,
) {
  const projectedRevenue = getProjectedRevenue(reservations);
  const bookedNights = getBookedNightsTotal(reservations);
  const avgNightlyRate = getAverageBaseNightlyRate(pricing);
  const nightsNeeded = getNightsNeededToBeatBenchmark(
    pricing.benchmarkMonthlyRent,
    avgNightlyRate,
  );
  const benchmarkDifference = getBenchmarkDifference(
    reservations,
    pricing.benchmarkMonthlyRent,
  );

  return {
    projectedRevenue,
    bookedNights,
    avgNightlyRate,
    nightsNeeded,
    benchmarkDifference,
  };
}