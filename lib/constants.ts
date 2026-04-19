export const APP_NAME = "Sturgeon Flat App";

export const PROPERTY_NAME = "Sturgeon Spirits Distillery Flat";

export const MONTHLY_RENT_BENCHMARK = 1300;

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/reservations", label: "Reservations" },
  { href: "/calendar", label: "Calendar" },
  { href: "/pricing", label: "Pricing" },
  { href: "/reports", label: "Reports" },
  { href: "/settings", label: "Settings" },
] as const;

export const CHANNELS = ["Airbnb", "Vrbo", "Manual"] as const;

export const PHASE_1_GOALS = [
  "Track reservations in one place",
  "Maintain a canonical calendar",
  "Set baseline and event pricing",
  "Measure performance against $1,300 monthly benchmark",
] as const;