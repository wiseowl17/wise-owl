import { cn } from "@/lib/utils";

type MarkProps = { className?: string };

/** A — Profile colophon. Side view, hooked beak, one tuft. */
export function MarkProfile({ className }: MarkProps) {
  return (
    <svg viewBox="0 0 64 64" className={cn("shrink-0", className)} aria-hidden>
      <path
        fill="currentColor"
        d="M24.5 8.2c1.8 4.8 2.6 8.4 2.2 12.4 4.2-1.4 9.6.2 13.2 4.2 4.4 4.8 4.8 11.2 1.6 16.2l7.2-.6c2.4.6 2.8 3.6.4 5.2-4.8 3.2-12.6 6.6-21.4 6.2-9.2-.4-16.8-5.4-18.6-13.6C7.3 28.6 12.2 19 20.8 14.4c.4-2.8-.2-5.8-1.8-9.2 2.4.4 4.4 1.4 5.5 3Z"
      />
    </svg>
  );
}

/** B — Construction lines. Frontal contour, no eyes, no fill. */
export function MarkLine({ className }: MarkProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("shrink-0", className)}
      fill="none"
      aria-hidden
    >
      <path
        d="M18 25.5 25 8.5 32 22 39 8.5 46 25.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d="M14.5 31c0-6.5 7.4-11 17.5-11s17.5 4.5 17.5 11c0 13.5-6.2 22.5-17.5 22.5S14.5 44.5 14.5 31Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** C — Seal. Thin ring, reduced owl as two tufts over an arc. */
export function MarkSeal({ className }: MarkProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("shrink-0", className)}
      fill="none"
      aria-hidden
    >
      <circle cx="32" cy="32" r="27" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M20 30 26.5 14 32 27 37.5 14 44 30"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d="M18 34c2.5 12 8.5 17.5 14 17.5S43.5 46 46 34"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** D — Tufted W. The peaks of the letter are the ears. */
export function MarkW({ className }: MarkProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("shrink-0", className)}
      fill="none"
      aria-hidden
    >
      <path
        d="M10 8 20 56 32 24 44 56 54 8"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinejoin="miter"
        strokeMiterlimit="2.5"
        strokeLinecap="butt"
      />
    </svg>
  );
}

export const LOGO_OPTIONS = [
  {
    id: "A",
    name: "Profile",
    note: "A publisher’s colophon. Side view, one tuft, hooked beak. No face.",
    Mark: MarkProfile,
  },
  {
    id: "B",
    name: "Contour",
    note: "A single-weight outline. Horned head, no eyes, no fill. Reads like type.",
    Mark: MarkLine,
  },
  {
    id: "C",
    name: "Seal",
    note: "A ring with the least owl that still reads. For a studio crest.",
    Mark: MarkSeal,
  },
  {
    id: "D",
    name: "Tufted W",
    note: "A W whose peaks are the ear-tufts. More letter than animal.",
    Mark: MarkW,
  },
] as const;
