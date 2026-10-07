import { newIdempotencyKey } from "@/lib/ids";

/** Client-generated idempotency key for one answer submission. */
export const newSubmissionId = newIdempotencyKey;
