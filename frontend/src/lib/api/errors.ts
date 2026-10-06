/**
 * One error type for every failure the API layer can produce, so components never parse
 * responses themselves. The backend's envelope is `{ "error": { code, message, details } }`.
 */

export type ApiErrorKind = "http" | "validation" | "network" | "unknown";

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | null;
  readonly code: string;
  readonly details: Record<string, unknown>;

  constructor(options: {
    kind: ApiErrorKind;
    status: number | null;
    code: string;
    message: string;
    details?: Record<string, unknown>;
  }) {
    super(options.message);
    this.name = "ApiError";
    this.kind = options.kind;
    this.status = options.status;
    this.code = options.code;
    this.details = options.details ?? {};
  }

  /** Server-side problems and lost connections are worth retrying; client errors are not. */
  get isRetryable(): boolean {
    return this.kind === "network" || (this.status !== null && this.status >= 500);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Build an ApiError from a non-2xx response body (enveloped or not). */
export function errorFromResponse(status: number, body: unknown): ApiError {
  const envelope = isRecord(body) && isRecord(body.error) ? body.error : null;
  const code = typeof envelope?.code === "string" ? envelope.code : `HTTP_${status}`;
  return new ApiError({
    kind: code === "VALIDATION_ERROR" ? "validation" : "http",
    status,
    code,
    message: typeof envelope?.message === "string" ? envelope.message : "Request failed.",
    details: isRecord(envelope?.details) ? envelope.details : {},
  });
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof TypeError) {
    // fetch() rejects with a TypeError when the server is unreachable.
    return new ApiError({ kind: "network", status: null, code: "NETWORK_ERROR", message: error.message });
  }
  return new ApiError({ kind: "unknown", status: null, code: "UNKNOWN_ERROR", message: String(error) });
}

/** Backend codes whose messages are written for learners and safe to show as-is. */
const LEARNER_FACING_CODES = new Set([
  "LESSON_LOCKED",
  "OUT_OF_HEARTS",
  "HEARTS_FULL",
  "INSUFFICIENT_GEMS",
  "LESSON_NOT_FINISHED",
]);

export interface FriendlyError {
  title: string;
  description: string;
}

/** Translate any failure into copy for the UI — never stack traces or HTTP internals. */
export function friendlyError(error: unknown): FriendlyError {
  const apiError = toApiError(error);
  if (apiError.kind === "network") {
    return {
      title: "We can't reach Lingo right now",
      description: "Check your connection and try again.",
    };
  }
  if (LEARNER_FACING_CODES.has(apiError.code)) {
    return { title: "Hold on!", description: apiError.message };
  }
  if (apiError.status === 404) {
    return { title: "We couldn't find that", description: "It may have moved. Head back and try again." };
  }
  return {
    title: "Something went wrong",
    description: "Don't worry, your progress is safe. Please try again.",
  };
}
