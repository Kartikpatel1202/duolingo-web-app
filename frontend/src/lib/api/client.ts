/**
 * The only module that talks HTTP.
 *
 * `openapi-fetch` checks paths, params and bodies against the generated `paths` type, so a
 * request to an endpoint or field that the backend does not have fails type-checking.
 * `request()` turns every outcome into either typed data or a thrown `ApiError`.
 */
import createClient from "openapi-fetch";

import { errorFromResponse, toApiError } from "./errors";
import type { paths } from "./schema";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const api = createClient<paths>({ baseUrl: API_BASE_URL });

type FetchResult<T> =
  | { data: T; error?: never; response: Response }
  | { data?: never; error: unknown; response: Response };

export async function request<T>(call: Promise<FetchResult<T>>): Promise<T> {
  let result: FetchResult<T>;
  try {
    result = await call;
  } catch (error) {
    throw toApiError(error);
  }
  if ("error" in result && result.error !== undefined) {
    throw errorFromResponse(result.response.status, result.error);
  }
  if (!result.response.ok || result.data === undefined) {
    throw errorFromResponse(result.response.status, undefined);
  }
  return result.data;
}
