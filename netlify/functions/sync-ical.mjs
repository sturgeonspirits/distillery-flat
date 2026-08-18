export default async function syncIcal() {
  const baseUrl =
    process.env.APP_URL || process.env.SYNC_BASE_URL || process.env.URL;
  const secret = process.env.ICAL_SYNC_SECRET;

  if (!baseUrl) {
    return new Response("Missing APP_URL, SYNC_BASE_URL, or Netlify URL", {
      status: 500,
    });
  }

  if (!secret) {
    return new Response("Missing ICAL_SYNC_SECRET", { status: 500 });
  }

  const response = await fetch(`${baseUrl}/api/internal/sync-ical`, {
    method: "GET",
    headers: {
      "x-sync-secret": secret,
    },
  });

  const text = await response.text();

  return new Response(text, {
    status: response.status,
    headers: {
      "content-type": "application/json",
    },
  });
}

export const config = {
  schedule: "*/30 * * * *",
};
