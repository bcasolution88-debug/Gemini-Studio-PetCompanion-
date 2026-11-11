/**
 * Attaches the Firebase ID token to every same-origin `/api/*` request.
 *
 * The server's `apiAuth` middleware expects `Authorization: Bearer <idToken>`
 * whenever `AUTH_MODE=required`. Rather than editing 27 individual `fetch()`
 * call sites, install this once at boot and patch `window.fetch`.
 *
 * Behaviour:
 *  - Only same-origin `/api/*` calls are touched (external APIs are untouched).
 *  - A cached token is reused until it is close to expiring.
 *  - Anonymous visitors simply send no header; the server decides policy.
 */
import { auth } from "./firebase";

let cachedToken: { value: string; expiresAt: number } | null = null;

/** Returns a fresh Firebase ID token, or null when nobody is signed in. */
export async function getApiAuthToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;

  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt - now > 60_000) {
    return cachedToken.value;
  }

  try {
    // Force a refresh only when we have no valid cached token.
    const result = await user.getIdTokenResult(cachedToken === null);
    cachedToken = {
      value: result.token,
      expiresAt: new Date(result.expirationTime).getTime(),
    };
    return cachedToken.value;
  } catch (error) {
    console.error("[apiAuth] Unable to obtain an ID token:", error);
    return null;
  }
}

/** Clears the cache so the next call re-reads the current user. */
export function resetApiAuthToken(): void {
  cachedToken = null;
}

function shouldAttach(url: string): boolean {
  try {
    const resolved = new URL(url, window.location.origin);
    return resolved.origin === window.location.origin && resolved.pathname.startsWith("/api/");
  } catch {
    return false;
  }
}

let installed = false;

/**
 * Wraps `window.fetch` so `/api/*` calls carry the current user's ID token.
 * Safe to call more than once.
 */
export function installApiAuthInterceptor(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string"
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;

    if (!shouldAttach(url)) {
      return originalFetch(input, init);
    }

    const token = await getApiAuthToken();
    if (!token) {
      return originalFetch(input, init);
    }

    const headers = new Headers(
      init?.headers ?? (input instanceof Request ? input.headers : undefined),
    );
    if (!headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return originalFetch(input, { ...init, headers });
  };

  // Drop the cached token when the identity changes.
  auth.onAuthStateChanged(() => resetApiAuthToken());
}
