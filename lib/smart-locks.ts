import {
  ANGELS_SHARE_UNIT_ID,
  DISTILLERY_FLATS_DOWNSTAIRS_UNIT_ID,
  getRentalUnitName,
} from "@/lib/units";

export type SmartLockProvider =
  | "schlage_engage"
  | "schlage"
  | "yale"
  | "august"
  | "remoteLock"
  | "other";

export const SMART_LOCK_PROVIDER_OPTIONS: Array<{
  value: SmartLockProvider;
  label: string;
}> = [
  { value: "schlage_engage", label: "Schlage Engage" },
  { value: "remoteLock", label: "RemoteLock" },
  { value: "yale", label: "Yale" },
  { value: "august", label: "August" },
  { value: "other", label: "Other" },
];

export const SMART_LOCK_PROVIDER_LABELS: Record<SmartLockProvider, string> = {
  schlage_engage: "Schlage Engage",
  schlage: "Schlage",
  remoteLock: "RemoteLock",
  yale: "Yale",
  august: "August",
  other: "Other",
};

export const DISTILLERY_FLATS_DEFAULT_LOCKS = [
  {
    unit_id: DISTILLERY_FLATS_DOWNSTAIRS_UNIT_ID,
    name: "Shared Exterior Door",
    provider: "schlage_engage",
    external_lock_id: null,
    applies_to_all_units: true,
  },
  {
    unit_id: DISTILLERY_FLATS_DOWNSTAIRS_UNIT_ID,
    name: "The Rickhouse Apartment Door",
    provider: "schlage_engage",
    external_lock_id: null,
    applies_to_all_units: false,
  },
  {
    unit_id: ANGELS_SHARE_UNIT_ID,
    name: "Angel's Share Apartment Door",
    provider: "schlage_engage",
    external_lock_id: null,
    applies_to_all_units: false,
  },
] as const;

export type DefaultSmartLock = (typeof DISTILLERY_FLATS_DEFAULT_LOCKS)[number];

export function getSmartLockProviderLabel(provider: string) {
  return (
    SMART_LOCK_PROVIDER_LABELS[provider as SmartLockProvider] ??
    provider.replace(/_/g, " ")
  );
}

export function getSmartLockScopeLabel(lock: {
  unit_id: string;
  applies_to_all_units?: boolean | null;
}) {
  if (lock.applies_to_all_units) {
    return "Shared exterior door (all rentals)";
  }

  return getRentalUnitName(lock.unit_id);
}

export function smartLockSetupKey(lock: {
  unit_id: string;
  name: string;
  applies_to_all_units?: boolean | null;
}) {
  return [
    lock.unit_id,
    lock.name.trim().toLowerCase(),
    lock.applies_to_all_units ? "shared" : "unit",
  ].join(":");
}
