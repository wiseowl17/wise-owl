import { studioCall } from "@/lib/studio-api";

/** Asks the server whether the session cookie is valid. */
export async function getStudioSession() {
  try {
    const { email } = await studioCall<{ email: string | null }>("session");
    return email;
  } catch {
    return null;
  }
}

export async function signInStudio(email: string, password: string) {
  await studioCall("login", { email, password });
}

export async function signOutStudio() {
  await studioCall("logout").catch(() => undefined);
}

export function studioNextPath(value: unknown) {
  const next = String(value ?? "").trim();
  if (next.startsWith("/studio") && !next.startsWith("//")) return next;
  return "/studio";
}
