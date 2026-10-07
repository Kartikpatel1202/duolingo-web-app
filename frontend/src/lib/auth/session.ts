/**
 * The signed-in session: one token from `POST /api/auth/login`, kept in localStorage so it
 * survives refreshes and is shared by every tab. Nothing else about the learner is stored here —
 * who they are always comes from the API, using this token.
 *
 * Every access is guarded: storage can be unavailable (private mode) and none of it exists on
 * the server.
 */
export const SESSION_STORAGE_KEY = "lingo-session";
const CHANGE_EVENT = "lingo-session-change";

export function readSession(): string | null {
  try {
    return window.localStorage.getItem(SESSION_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function saveSession(token: string): void {
  try {
    window.localStorage.setItem(SESSION_STORAGE_KEY, token);
  } catch {
    // Without storage the session lasts only until the page is closed.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/**
 * Forget the session. Listeners are told by default, so open screens react (the route guard sends
 * the visitor to log in). Pass `notify: false` when the page is about to be replaced anyway.
 */
export function clearSession({ notify = true }: { notify?: boolean } = {}): void {
  try {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
  if (notify) window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Notifies when the session changes in this tab or (via the storage event) in another one. */
export function subscribeToSession(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
