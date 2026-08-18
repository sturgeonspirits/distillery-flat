export function createClient(): never {
  throw new Error(
    "The Google Sheets backend is server-only. Use server actions or route handlers for data access.",
  );
}
