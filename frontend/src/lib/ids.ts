/**
 * Client-generated idempotency key. One key per user intent (an answer, a purchase), reused when
 * that request is retried, so the server can recognise the retry and apply the effect once.
 */
export function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `key-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
