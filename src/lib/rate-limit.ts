interface Entry {
  count: number;
  windowStart: number;
}

const store = new Map<string, Entry>();
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < windowMs) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now - entry.windowStart > windowMs) store.delete(key);
  }
}

/**
 * In-memory sliding-window rate limiter (per IP).
 * Suitable for single-instance deployments. Swap for Upstash Redis on multi-region.
 *
 * @param ip       Client IP address
 * @param limit    Max requests allowed per window (default 10)
 * @param windowMs Window size in ms (default 60 000 = 1 minute)
 */
export function checkRateLimit(
  ip: string,
  limit = 10,
  windowMs = 60_000,
): { allowed: boolean; retryAfter: number } {
  cleanup(windowMs);
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now - entry.windowStart > windowMs) {
    store.set(ip, { count: 1, windowStart: now });
    return { allowed: true, retryAfter: 0 };
  }

  if (entry.count >= limit) {
    const retryAfter = Math.ceil((entry.windowStart + windowMs - now) / 1000);
    return { allowed: false, retryAfter };
  }

  entry.count++;
  return { allowed: true, retryAfter: 0 };
}

/** Returns a standard 429 response body. */
export function rateLimitExceeded(): Response {
  return new Response(
    JSON.stringify({ error: "Zu viele Anfragen. Bitte warte kurz." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": "60",
      },
    },
  );
}
