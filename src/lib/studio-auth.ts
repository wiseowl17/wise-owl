const SESSION_KEY = "wise-owl-studio-session";
const OWNER_EMAIL = "mlcruz9804@gmail.com";
const OWNER_HASH =
  "393b176d93f2254c596c6d855cdf3c07a75d5a04dcccb3144099ec3d58e36aae";

async function digest(email: string, password: string) {
  const payload = `${email.trim().toLowerCase()}\n${password}`;
  const buffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(payload),
  );
  return [...new Uint8Array(buffer)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function isStudioSignedIn() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(SESSION_KEY) === OWNER_EMAIL;
  } catch {
    return false;
  }
}

export async function signInStudio(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  const hash = await digest(normalized, password);
  if (normalized !== OWNER_EMAIL || hash !== OWNER_HASH) {
    throw new Error("Email or password is wrong.");
  }
  window.localStorage.setItem(SESSION_KEY, OWNER_EMAIL);
}

export function signOutStudio() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
}

export function studioNextPath(value: unknown) {
  const next = String(value ?? "").trim();
  if (next.startsWith("/studio")) return next;
  return "/studio.html";
}
