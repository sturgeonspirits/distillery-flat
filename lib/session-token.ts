export const SESSION_COOKIE_NAME = "sturgeon_flat_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

type SessionPayload = {
  sub: string;
  email: string;
  exp: number;
  nonce: string;
};

export type AppUser = {
  id: string;
  email: string;
};

function getSessionSecret() {
  return (
    process.env.AUTH_SECRET?.trim() ||
    process.env.SESSION_SECRET?.trim() ||
    ""
  );
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.slice(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary)
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlToBytes(value: string) {
  const padded = value.padEnd(value.length + ((4 - (value.length % 4)) % 4), "=");
  const binary = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function encodeString(value: string) {
  return new TextEncoder().encode(value);
}

function encodePayload(payload: SessionPayload) {
  return bytesToBase64Url(encodeString(JSON.stringify(payload)));
}

function decodePayload(value: string) {
  return JSON.parse(
    new TextDecoder().decode(base64UrlToBytes(value)),
  ) as SessionPayload;
}

async function getHmacKey(secret: string, usage: KeyUsage[]) {
  return crypto.subtle.importKey(
    "raw",
    encodeString(secret),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    usage,
  );
}

async function signPayload(encodedPayload: string, secret: string) {
  const key = await getHmacKey(secret, ["sign"]);
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encodeString(encodedPayload),
  );

  return bytesToBase64Url(new Uint8Array(signature));
}

async function verifySignature(input: {
  encodedPayload: string;
  signature: string;
  secret: string;
}) {
  const key = await getHmacKey(input.secret, ["verify"]);

  return crypto.subtle.verify(
    "HMAC",
    key,
    base64UrlToBytes(input.signature),
    encodeString(input.encodedPayload),
  );
}

export async function createSessionToken(payload: SessionPayload) {
  const secret = getSessionSecret();

  if (!secret) {
    throw new Error("Missing AUTH_SECRET or SESSION_SECRET.");
  }

  const encodedPayload = encodePayload(payload);
  const signature = await signPayload(encodedPayload, secret);

  return `${encodedPayload}.${signature}`;
}

export async function verifySessionToken(
  token: string | undefined | null,
): Promise<AppUser | null> {
  if (!token) return null;

  const secret = getSessionSecret();
  if (!secret) return null;

  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) return null;

  try {
    const validSignature = await verifySignature({
      encodedPayload,
      signature,
      secret,
    });

    if (!validSignature) {
      return null;
    }

    const payload = decodePayload(encodedPayload);

    if (!payload.sub || !payload.email || !payload.exp) {
      return null;
    }

    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return {
      id: payload.sub,
      email: payload.email,
    };
  } catch {
    return null;
  }
}
