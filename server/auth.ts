/**
 * API authentication & rate limiting for the Pet Companion Platform server.
 *
 * Why this file exists
 * --------------------
 * The audit found that every `/api/*` route (including the cost-bearing Gemini
 * endpoints) was reachable anonymously. This module adds:
 *
 *   1. `verifyFirebaseIdToken()` - a dependency-free RS256 verifier for Firebase
 *      ID tokens using the public JWKS published by Google.
 *   2. `apiAuth()` - an Express middleware that identifies the caller and stores
 *      the result on `req.auth`.
 *   3. `rateLimit()` - an in-memory sliding-window limiter (per user when signed
 *      in, per IP otherwise) so anonymous traffic cannot burn the Gemini quota.
 *
 * Enforcement is controlled by `AUTH_MODE`:
 *   - `optional` (default): identify when a token is present, allow anonymous.
 *   - `required`: reject unauthenticated calls to protected routes with 401.
 *
 * Set `AUTH_MODE=required` before exposing the app publicly.
 */
import { createPublicKey, verify as cryptoVerify } from "crypto";
import type { NextFunction, Request, Response } from "express";

const JWKS_URL =
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";

export type AuthMode = "optional" | "required";

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  name?: string;
  /** "anonymous" means a rate-limit-only identity derived from the client IP. */
  provider: "firebase" | "anonymous";
}

declare module "express-serve-static-core" {
  interface Request {
    auth?: AuthenticatedUser;
  }
}

// ---------------------------------------------------------------------------
// JWKS cache
// ---------------------------------------------------------------------------

interface JwkKey {
  kid: string;
  n: string;
  e: string;
  alg?: string;
  use?: string;
}

let jwksCache: { keys: Map<string, JwkKey>; fetchedAt: number } | null = null;
const JWKS_TTL_MS = 60 * 60 * 1000; // Google rotates signing keys rarely.

async function getSigningKeys(): Promise<Map<string, JwkKey>> {
  if (jwksCache && Date.now() - jwksCache.fetchedAt < JWKS_TTL_MS) {
    return jwksCache.keys;
  }
  const res = await fetch(JWKS_URL);
  if (!res.ok) {
    throw new Error(`Unable to fetch Firebase JWKS (HTTP ${res.status})`);
  }
  const body = (await res.json()) as { keys?: JwkKey[] };
  const keys = new Map<string, JwkKey>();
  for (const key of body.keys ?? []) {
    if (!key.kid || !key.n || !key.e) continue;
    keys.set(key.kid, key);
  }
  if (keys.size === 0) {
    throw new Error("Firebase JWKS response contained no usable keys");
  }
  jwksCache = { keys, fetchedAt: Date.now() };
  return keys;
}

function decodeJwtPart<T>(part: string): T {
  return JSON.parse(Buffer.from(part, "base64url").toString("utf8")) as T;
}

export interface FirebaseIdTokenPayload {
  iss: string;
  aud: string;
  sub: string;
  exp: number;
  iat: number;
  auth_time?: number;
  email?: string;
  name?: string;
  user_id?: string;
  firebase?: { sign_in_provider?: string; identities?: Record<string, unknown> };
}

/**
 * Verify a Firebase ID token.
 *
 * Checks the RS256 signature against Google's published JWKS, plus `iss`, `aud`
 * and `exp`. Throws an Error with a human readable message on failure.
 */
export async function verifyFirebaseIdToken(
  idToken: string,
  projectId: string,
): Promise<FirebaseIdTokenPayload> {
  const segments = idToken.split(".");
  if (segments.length !== 3) {
    throw new Error("Malformed ID token: expected three dot-separated segments");
  }
  const [rawHeader, rawPayload, rawSignature] = segments;

  const header = decodeJwtPart<{ alg?: string; kid?: string; typ?: string }>(rawHeader);
  if (header.alg !== "RS256") {
    throw new Error(`Unsupported token algorithm: ${header.alg ?? "none"}`);
  }
  if (!header.kid) {
    throw new Error("Token header is missing a key id (kid)");
  }

  const keys = await getSigningKeys();
  const jwk = keys.get(header.kid);
  if (!jwk) {
    // Force a refresh once: the key may have rotated since we cached.
    jwksCache = null;
    const refreshed = await getSigningKeys();
    const retried = refreshed.get(header.kid);
    if (!retried) {
      throw new Error("Token was signed with an unknown key id");
    }
    return verifyWithKey(retried, projectId, rawHeader, rawPayload, rawSignature);
  }

  return verifyWithKey(jwk, projectId, rawHeader, rawPayload, rawSignature);
}

function verifyWithKey(
  jwk: JwkKey,
  projectId: string,
  rawHeader: string,
  rawPayload: string,
  rawSignature: string,
): FirebaseIdTokenPayload {
  const publicKey = createPublicKey({
    key: { kty: "RSA", n: jwk.n, e: jwk.e },
    format: "jwk",
  } as never);

  const signingInput = Buffer.from(`${rawHeader}.${rawPayload}`);
  const signature = Buffer.from(rawSignature, "base64url");
  const valid = cryptoVerify("RSA-SHA256", signingInput, publicKey, signature);
  if (!valid) {
    throw new Error("Token signature verification failed");
  }

  const payload = decodeJwtPart<FirebaseIdTokenPayload>(rawPayload);
  const now = Math.floor(Date.now() / 1000);

  if (payload.iss !== `https://securetoken.google.com/${projectId}`) {
    throw new Error("Token issuer does not match this Firebase project");
  }
  if (payload.aud !== projectId) {
    throw new Error("Token audience does not match this Firebase project");
  }
  if (typeof payload.exp !== "number" || payload.exp <= now) {
    throw new Error("Token has expired");
  }
  if (typeof payload.iat !== "number" || payload.iat > now + 60) {
    throw new Error("Token issued-at time is in the future");
  }
  if (!payload.sub) {
    throw new Error("Token is missing a subject (uid)");
  }
  return payload;
}

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------

interface Bucket {
  hits: number[];
  lastSeen: number;
}

export interface RateLimitOptions {
  /** Sliding window length in milliseconds. */
  windowMs: number;
  /** Maximum requests permitted inside the window. */
  max: number;
  /** Distinguishes independent limiters (e.g. "ai", "default"). */
  name: string;
}

export function createRateLimiter(options: RateLimitOptions) {
  const buckets = new Map<string, Bucket>();

  // Periodically drop idle buckets so the map cannot grow without bound.
  const sweeper = setInterval(() => {
    const cutoff = Date.now() - options.windowMs * 2;
    for (const [key, bucket] of buckets) {
      if (bucket.lastSeen < cutoff) buckets.delete(key);
    }
  }, options.windowMs);
  if (typeof sweeper.unref === "function") sweeper.unref();

  return function rateLimit(req: Request, res: Response, next: NextFunction) {
    const identity = req.auth?.uid ?? clientIp(req);
    const key = `${options.name}:${identity}`;
    const now = Date.now();
    const cutoff = now - options.windowMs;

    const bucket = buckets.get(key) ?? { hits: [], lastSeen: now };
    bucket.hits = bucket.hits.filter((t) => t > cutoff);
    bucket.lastSeen = now;

    const remaining = Math.max(0, options.max - bucket.hits.length);
    res.setHeader("X-RateLimit-Limit", String(options.max));
    res.setHeader("X-RateLimit-Remaining", String(remaining));
    res.setHeader("X-RateLimit-Window", String(options.windowMs));

    if (bucket.hits.length >= options.max) {
      const retryAfter = Math.ceil((bucket.hits[0] + options.windowMs - now) / 1000);
      res.setHeader("Retry-After", String(Math.max(1, retryAfter)));
      buckets.set(key, bucket);
      return res.status(429).json({
        error: "rate_limited",
        message: `Too many requests. Retry in ${Math.max(1, retryAfter)}s.`,
        retryAfterSeconds: Math.max(1, retryAfter),
      });
    }

    bucket.hits.push(now);
    buckets.set(key, bucket);
    next();
  };
}

export function clientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  let ip = "";
  if (typeof forwarded === "string") {
    ip = forwarded.split(",")[0].trim();
  } else if (Array.isArray(forwarded) && forwarded.length > 0) {
    ip = forwarded[0].trim();
  } else {
    ip = req.socket.remoteAddress ?? "";
  }
  if (ip.startsWith("::ffff:")) ip = ip.substring(7);
  return ip || "unknown";
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export interface ApiAuthOptions {
  /** Firebase project id used for `aud` / `iss` validation. */
  projectId: string;
  mode: AuthMode;
  /** Route prefixes that always stay public even when mode === "required". */
  publicPrefixes?: string[];
}

/**
 * Identifies the caller from a `Authorization: Bearer <firebase-id-token>`
 * header. Never throws for malformed tokens: it simply leaves `req.auth`
 * undefined so the route-level policy can decide what to do.
 */
export function apiAuth(options: ApiAuthOptions) {
  const publicPrefixes = options.publicPrefixes ?? [];
  const hasToken = (req: Request) => req.headers.authorization?.startsWith("Bearer ");

  return async function apiAuthMiddleware(req: Request, res: Response, next: NextFunction) {
    if (hasToken(req)) {
      const idToken = req.headers.authorization!.slice("Bearer ".length).trim();
      try {
        const payload = await verifyFirebaseIdToken(idToken, options.projectId);
        req.auth = {
          uid: payload.sub,
          email: payload.email,
          name: payload.name,
          provider: "firebase",
        };
      } catch (error) {
        // An explicitly supplied token must be valid, otherwise a client could
        // smuggle invalid credentials past the `required` policy.
        if (options.mode === "required") {
          return res.status(401).json({
            error: "invalid_token",
            message: error instanceof Error ? error.message : "Invalid authentication token",
          });
        }
        console.warn(
          `[auth] Ignoring invalid ID token for ${req.method} ${req.path}:`,
          error instanceof Error ? error.message : error,
        );
      }
    }

    const isPublic = publicPrefixes.some((prefix) => req.path.startsWith(prefix));

    if (options.mode === "required" && !isPublic) {
      if (!req.auth) {
        return res.status(401).json({
          error: "authentication_required",
          message:
            "This API requires a signed-in user. Send an Authorization: Bearer <firebase-id-token> header.",
        });
      }
      return next();
    }

    if (!req.auth) {
      req.auth = { uid: `anon:${clientIp(req)}`, provider: "anonymous" };
    }
    next();
  };
}
