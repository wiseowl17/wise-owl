/** Browser client for `api/studio.ts`. The session lives in an HttpOnly cookie. */

export class StudioApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function studioCall<T = unknown>(
  action: string,
  data: Record<string, unknown> = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch("/api/studio", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json", "x-studio": "1" },
      body: JSON.stringify({ action, data }),
    });
  } catch {
    throw new StudioApiError(0, "No connection. Check your internet and try again.");
  }
  const body = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) {
    throw new StudioApiError(
      response.status,
      body.error || "Something went wrong. Try again.",
    );
  }
  return body as T;
}

/** Private calls: a 401 means the session expired, so send the owner back to sign in. */
export async function studio<T = unknown>(
  action: string,
  data: Record<string, unknown> = {},
): Promise<T> {
  try {
    return await studioCall<T>(action, data);
  } catch (err) {
    if (err instanceof StudioApiError && err.status === 401 && typeof window !== "undefined") {
      const next = `${window.location.pathname}${window.location.search}`;
      window.location.replace(`/login?next=${encodeURIComponent(next)}`);
    }
    throw err;
  }
}
