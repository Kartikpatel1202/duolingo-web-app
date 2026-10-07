/**
 * The only module that talks HTTP.
 *
 * `openapi-fetch` checks paths, params and bodies against the generated `paths` type, so a
 * request to an endpoint or field that the backend does not have fails type-checking.
 * `request()` turns every outcome into either typed data or a thrown `ApiError`.
 */
import createClient, { type Middleware } from "openapi-fetch";

import { clearSession, readSession } from "@/lib/auth/session";

import { errorFromResponse, toApiError } from "./errors";
import type { paths } from "./schema";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const api = createClient<paths>({ baseUrl: API_BASE_URL });

/**
 * Every request carries the session token. A 401 from anything except the login call means the
 * session is no longer valid (expired or revoked), so it is cleared — the app shell then sends
 * the learner to the login page.
 */
const sessionMiddleware: Middleware = {
  onRequest({ request }) {
    const token = typeof window === "undefined" ? null : readSession();
    if (token) request.headers.set("Authorization", `Bearer ${token}`);
    return request;
  },
  onResponse({ request, response }) {
    if (response.status === 401 && !new URL(request.url).pathname.endsWith("/auth/login")) clearSession();
    return response;
  },
};
api.use(sessionMiddleware);

type FetchResult<T> =
  | { data: T; error?: never; response: Response }
  | { data?: never; error: unknown; response: Response };

export async function request<T>(call: Promise<FetchResult<T>>): Promise<NonNullable<T>> {
  let result: FetchResult<T>;
  try {
    result = await call;
  } catch (error) {
    throw toApiError(error);
  }
  if ("error" in result && result.error !== undefined) {
    throw errorFromResponse(result.response.status, result.error);
  }
  if (!result.response.ok || result.data == null) {
    throw errorFromResponse(result.response.status, undefined);
  }
  return result.data;
}
