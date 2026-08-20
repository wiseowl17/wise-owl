import { cn } from "@/lib/utils";

export function OwlMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 96 76"
      className={cn("shrink-0", className)}
      fill="none"
      aria-hidden="true"
    >
      <path
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M30 34 40 8l9 18
           C52 24 62 24 71 31
           C80 38 82 48 74 57
           C69 63 59 67 48 67
           C36 67 26 59 24 46
           C23 39 25 35 30 34Z"
      />
      <path
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M71 40c6 2 11 6 13 11"
      />
      <path
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        d="M53 39h8"
      />
    </svg>
  );
}

export function Wordmark({
  className,
  markClassName,
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 text-fg", className)}>
      <OwlMark className={cn("h-8 w-10 text-accent", markClassName)} />
      <span className="font-display text-xl leading-none tracking-tight">
        Wise Owl
      </span>
    </span>
  );
}
