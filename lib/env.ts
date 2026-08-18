import "server-only";

export function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing ${name}`);
  }

  return value;
}

export function getAppUrl(): string {
  return (
    process.env.APP_URL?.trim() ||
    process.env.SYNC_BASE_URL?.trim() ||
    process.env.URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export function getUnitId(): string {
  return (
    process.env.UNIT_ID?.trim() ||
    "cdd0a039-ef0a-44b5-a68d-339866029d42"
  );
}

export function getIcalAllowedHosts(): string[] {
  const raw = process.env.ICAL_ALLOWED_HOSTS?.trim();

  if (!raw) {
    return [];
  }

  return raw
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}
