import "server-only";

import { lookup } from "node:dns/promises";
import net from "node:net";
import { getIcalAllowedHosts } from "@/lib/env";

const PRIVATE_IPV4_RANGES: Array<[number, number]> = [
  [ipToInt("10.0.0.0"), ipToInt("10.255.255.255")],
  [ipToInt("127.0.0.0"), ipToInt("127.255.255.255")],
  [ipToInt("169.254.0.0"), ipToInt("169.254.255.255")],
  [ipToInt("172.16.0.0"), ipToInt("172.31.255.255")],
  [ipToInt("192.168.0.0"), ipToInt("192.168.255.255")],
  [ipToInt("0.0.0.0"), ipToInt("0.255.255.255")],
];

function ipToInt(ip: string): number {
  return ip
    .split(".")
    .map((part) => Number(part))
    .reduce((acc, part) => (acc << 8) + part, 0) >>> 0;
}

function isPrivateIpv4(ip: string): boolean {
  const value = ipToInt(ip);
  return PRIVATE_IPV4_RANGES.some(([start, end]) => value >= start && value <= end);
}

function isBlockedIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  return (
    normalized === "::1" ||
    normalized === "::" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80:")
  );
}

function assertAllowedHost(hostname: string) {
  const allowedHosts = getIcalAllowedHosts();

  if (allowedHosts.length === 0) {
    throw new Error(
      "ICAL_ALLOWED_HOSTS is not configured. Refusing to fetch external iCal feeds.",
    );
  }

  const normalized = hostname.toLowerCase();
  const matched = allowedHosts.some(
    (allowedHost) =>
      normalized === allowedHost || normalized.endsWith(`.${allowedHost}`),
  );

  if (!matched) {
    throw new Error(`iCal host is not allowlisted: ${hostname}`);
  }
}

async function assertSafeResolvedAddress(hostname: string) {
  const records = await lookup(hostname, { all: true, verbatim: true });

  if (records.length === 0) {
    throw new Error(`Could not resolve iCal host: ${hostname}`);
  }

  for (const record of records) {
    if (record.family === 4 && isPrivateIpv4(record.address)) {
      throw new Error(`iCal host resolves to a private IPv4 address: ${hostname}`);
    }

    if (record.family === 6 && isBlockedIpv6(record.address)) {
      throw new Error(`iCal host resolves to a blocked IPv6 address: ${hostname}`);
    }
  }
}

export function normalizeAndValidateIcalUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();

  if (!trimmed) {
    throw new Error("iCal feed URL is required.");
  }

  let url: URL;

  try {
    url = new URL(trimmed);
  } catch {
    throw new Error("Invalid iCal feed URL.");
  }

  if (url.protocol !== "https:") {
    throw new Error("iCal feed URL must use https.");
  }

  if (url.username || url.password) {
    throw new Error("iCal feed URL may not include embedded credentials.");
  }

  if (url.port && url.port !== "443") {
    throw new Error("iCal feed URL may not use a custom port.");
  }

  if (net.isIP(url.hostname)) {
    throw new Error("iCal feed URL must use a hostname, not a raw IP address.");
  }

  assertAllowedHost(url.hostname);

  url.hash = "";

  return url.toString();
}

export async function assertSafeIcalUrl(rawUrl: string): Promise<string> {
  const normalized = normalizeAndValidateIcalUrl(rawUrl);
  const url = new URL(normalized);
  await assertSafeResolvedAddress(url.hostname);
  return normalized;
}

export async function fetchTrustedIcalText(rawUrl: string): Promise<string> {
  const normalizedUrl = await assertSafeIcalUrl(rawUrl);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(normalizedUrl, {
      method: "GET",
      cache: "no-store",
      redirect: "error",
      signal: controller.signal,
      headers: {
        "user-agent": "sturgeon-flat-app/1.0",
        accept: "text/calendar,text/plain;q=0.9,*/*;q=0.1",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch iCal feed: ${response.status} ${response.statusText}`,
      );
    }

    const contentLength = Number(response.headers.get("content-length") || 0);
    if (contentLength > 1_000_000) {
      throw new Error("iCal feed is too large.");
    }

    const icsText = await response.text();

    if (!icsText.includes("BEGIN:VCALENDAR")) {
      throw new Error("Fetched content does not look like a valid iCal feed.");
    }

    if (Buffer.byteLength(icsText, "utf8") > 1_000_000) {
      throw new Error("iCal feed is too large.");
    }

    return icsText;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Timed out while fetching iCal feed.");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
