/**
 * The Studio used to keep its book in this browser only (localStorage).
 * These helpers let the owner move that old data into the database once.
 */
const KEY = "wise-owl-studio-v1";

export type LocalBook = {
  clients?: unknown[];
  sales?: unknown[];
  todos?: unknown[];
  onboardings?: unknown[];
  agreements?: unknown[];
};

export function readLocalBook(): LocalBook | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const book = JSON.parse(raw) as LocalBook;
    const count =
      (book.clients?.length ?? 0) + (book.sales?.length ?? 0) + (book.agreements?.length ?? 0);
    return count > 0 ? book : null;
  } catch {
    return null;
  }
}

export function archiveLocalBook() {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) window.localStorage.setItem(`${KEY}-imported`, raw);
    window.localStorage.removeItem(KEY);
  } catch {
    /* storage blocked; nothing to archive */
  }
}
