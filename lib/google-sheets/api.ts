import "server-only";

import { createSign } from "node:crypto";

const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const API_BASE = "https://sheets.googleapis.com/v4/spreadsheets";

type GoogleToken = {
  access_token: string;
  expires_at: number;
};

type ServiceAccountConfig = {
  spreadsheetId: string;
  clientEmail: string;
  privateKey: string;
};

type SheetMetadata = {
  sheets?: Array<{
    properties?: {
      sheetId?: number;
      title?: string;
    };
  }>;
};

let cachedToken: GoogleToken | null = null;

function getAppsScriptUrl() {
  return process.env.GOOGLE_APPS_SCRIPT_URL?.trim() || "";
}

function getAppsScriptSecret() {
  return process.env.GOOGLE_APPS_SCRIPT_SECRET?.trim() || "";
}

function shouldUseAppsScriptBackend() {
  return Boolean(getAppsScriptUrl());
}

function decodeBase64Env(value: string) {
  return Buffer.from(value, "base64").toString("utf8");
}

function getServiceAccountConfig(): ServiceAccountConfig {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID?.trim();
  const rawJson =
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim() ||
    (process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64?.trim()
      ? decodeBase64Env(process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64.trim())
      : "");

  if (!spreadsheetId) {
    throw new Error("Missing GOOGLE_SHEETS_SPREADSHEET_ID.");
  }

  if (rawJson) {
    const parsed = JSON.parse(rawJson) as {
      client_email?: string;
      private_key?: string;
    };

    if (!parsed.client_email || !parsed.private_key) {
      throw new Error(
        "GOOGLE_SERVICE_ACCOUNT_JSON must include client_email and private_key.",
      );
    }

    return {
      spreadsheetId,
      clientEmail: parsed.client_email,
      privateKey: parsed.private_key.replace(/\\n/g, "\n"),
    };
  }

  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const privateKey =
    process.env.GOOGLE_PRIVATE_KEY?.trim() ||
    (process.env.GOOGLE_PRIVATE_KEY_BASE64?.trim()
      ? decodeBase64Env(process.env.GOOGLE_PRIVATE_KEY_BASE64.trim())
      : "");

  if (!clientEmail) {
    throw new Error(
      "Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_SERVICE_ACCOUNT_JSON.",
    );
  }

  if (!privateKey) {
    throw new Error("Missing GOOGLE_PRIVATE_KEY or GOOGLE_SERVICE_ACCOUNT_JSON.");
  }

  return {
    spreadsheetId,
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, "\n"),
  };
}

function base64Url(input: string | Buffer) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function createServiceAccountAssertion(config: ServiceAccountConfig) {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const header = {
    alg: "RS256",
    typ: "JWT",
  };
  const payload = {
    iss: config.clientEmail,
    scope: SHEETS_SCOPE,
    aud: TOKEN_URL,
    exp: nowSeconds + 3600,
    iat: nowSeconds,
  };
  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedPayload = base64Url(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const signer = createSign("RSA-SHA256");

  signer.update(unsignedToken);
  signer.end();

  const signature = base64Url(signer.sign(config.privateKey));

  return `${unsignedToken}.${signature}`;
}

async function getAccessToken() {
  const now = Date.now();

  if (cachedToken && cachedToken.expires_at - 60_000 > now) {
    return cachedToken.access_token;
  }

  const config = getServiceAccountConfig();
  const assertion = createServiceAccountAssertion(config);
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google auth failed: ${response.status} ${text}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };

  cachedToken = {
    access_token: data.access_token,
    expires_at: now + data.expires_in * 1000,
  };

  return cachedToken.access_token;
}

async function googleRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const config = getServiceAccountConfig();
  const token = await getAccessToken();
  const response = await fetch(`${API_BASE}/${config.spreadsheetId}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google Sheets request failed: ${response.status} ${text}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function appsScriptRequest<T>(
  operation: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  const url = getAppsScriptUrl();
  const secret = getAppsScriptSecret();

  if (!url) {
    throw new Error("Missing GOOGLE_APPS_SCRIPT_URL.");
  }

  if (!secret) {
    throw new Error("Missing GOOGLE_APPS_SCRIPT_SECRET.");
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify({
      operation,
      secret,
      spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID?.trim() || "",
      ...args,
    }),
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Apps Script request failed: ${response.status} ${text}`);
  }

  let payload: {
    ok?: boolean;
    data?: T;
    error?: string;
  };

  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error(`Apps Script returned non-JSON response: ${text}`);
  }

  if (!payload.ok) {
    throw new Error(payload.error || "Apps Script request failed.");
  }

  return payload.data as T;
}

export function quoteSheetName(title: string) {
  return `'${title.replace(/'/g, "''")}'`;
}

export async function getSpreadsheetMetadata() {
  if (shouldUseAppsScriptBackend()) {
    return appsScriptRequest<SheetMetadata>("metadata");
  }

  return googleRequest<SheetMetadata>(
    "?fields=sheets(properties(sheetId,title))",
  );
}

export async function batchUpdateSpreadsheet(requests: unknown[]) {
  if (requests.length === 0) return;

  if (shouldUseAppsScriptBackend()) {
    await appsScriptRequest("batchUpdate", { requests });
    return;
  }

  await googleRequest(":batchUpdate", {
    method: "POST",
    body: JSON.stringify({ requests }),
  });
}

export async function getSheetValues(range: string) {
  if (shouldUseAppsScriptBackend()) {
    const data = await appsScriptRequest<{ values?: string[][] }>("getValues", {
      range,
    });

    return data.values ?? [];
  }

  const query = new URLSearchParams({
    majorDimension: "ROWS",
  });

  const data = await googleRequest<{ values?: string[][] }>(
    `/values/${encodeURIComponent(range)}?${query}`,
  );

  return data.values ?? [];
}

export async function updateSheetValues(range: string, values: unknown[][]) {
  if (shouldUseAppsScriptBackend()) {
    await appsScriptRequest("updateValues", { range, values });
    return;
  }

  const query = new URLSearchParams({
    valueInputOption: "RAW",
  });

  await googleRequest(`/values/${encodeURIComponent(range)}?${query}`, {
    method: "PUT",
    body: JSON.stringify({
      majorDimension: "ROWS",
      values,
    }),
  });
}

export async function clearSheetValues(range: string) {
  if (shouldUseAppsScriptBackend()) {
    await appsScriptRequest("clearValues", { range });
    return;
  }

  await googleRequest(`/values/${encodeURIComponent(range)}:clear`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}
