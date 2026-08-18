export const DISTILLERY_FLATS_DOWNSTAIRS_UNIT_ID =
  "cdd0a039-ef0a-44b5-a68d-339866029d42";
export const ANGELS_SHARE_UNIT_ID = "f7b8e2a1-6c4d-4f2a-9a3b-2c1d0e9f8a76";

export const DISTILLERY_FLAT_UNIT_ID = DISTILLERY_FLATS_DOWNSTAIRS_UNIT_ID;
export const DISTILLERY_LOFT_UNIT_ID = ANGELS_SHARE_UNIT_ID;

export const RENTAL_UNITS = [
  {
    id: DISTILLERY_FLATS_DOWNSTAIRS_UNIT_ID,
    name: "The Rickhouse",
    description: "Downstairs 3 bedroom rental at Distillery Flats",
    bedrooms: 3,
    level: "Downstairs",
  },
  {
    id: ANGELS_SHARE_UNIT_ID,
    name: "Angel's Share",
    description: "Upstairs 1 bedroom rental at Distillery Flats",
    bedrooms: 1,
    level: "Upstairs",
  },
] as const;

export type RentalUnit = (typeof RENTAL_UNITS)[number];

export function getDefaultUnitId() {
  return DISTILLERY_FLATS_DOWNSTAIRS_UNIT_ID;
}

export function getRentalUnitById(unitId: string | null | undefined) {
  return RENTAL_UNITS.find((unit) => unit.id === unitId) ?? null;
}

export function getRentalUnitName(unitId: string | null | undefined) {
  return getRentalUnitById(unitId)?.name ?? "Unknown unit";
}

export function assertRentalUnitId(unitId: string) {
  if (!getRentalUnitById(unitId)) {
    throw new Error("Choose a valid rental space.");
  }

  return unitId;
}
