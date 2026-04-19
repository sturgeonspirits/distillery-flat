import type { Reservation } from "@/types/reservation";
import type { PricingSnapshot } from "@/types/pricing";

type MockReservation = Pick<
  Reservation,
  | "id"
  | "guest_name"
  | "channel"
  | "check_in"
  | "check_out"
  | "status"
  | "guest_count"
  | "nightly_rate"
  | "cleaning_fee"
>;

export const MOCK_RESERVATIONS: MockReservation[] = [
  {
    id: "res_001",
    guest_name: "Aviation Group Booking",
    channel: "Airbnb",
    check_in: "2026-07-20",
    check_out: "2026-07-26",
    status: "confirmed",
    guest_count: 6,
    nightly_rate: 775,
    cleaning_fee: 175,
  },
  {
    id: "res_002",
    guest_name: "Weekend Distillery Stay",
    channel: "Vrbo",
    check_in: "2026-06-12",
    check_out: "2026-06-15",
    status: "confirmed",
    guest_count: 4,
    nightly_rate: 245,
    cleaning_fee: 140,
  },
  {
    id: "res_003",
    guest_name: "Manual Owner Referral",
    channel: "Manual",
    check_in: "2026-05-22",
    check_out: "2026-05-25",
    status: "inquiry",
    guest_count: 2,
    nightly_rate: 220,
    cleaning_fee: 125,
  },
];

export const MOCK_PRICING: PricingSnapshot = {
  baseWeekdayRate: 210,
  baseWeekendRate: 245,
  distilleryPremium: 35,
  eaaWeeklyTarget: 5400,
  cleaningFee: 140,
  benchmarkMonthlyRent: 1300,
};