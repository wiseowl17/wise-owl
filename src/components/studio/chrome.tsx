import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Wordmark } from "@/components/logo";
import { signOutStudio } from "@/lib/studio-auth";
import { cn } from "@/lib/utils";

export function StudioChrome({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="border-b border-line bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-5 py-4 sm:px-8">
          <a href="/studio.html">
            <Wordmark />
          </a>
          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <a href="/studio.html" className="text-muted transition-colors hover:text-fg">
              Portfolio
            </a>
            <Link to="/p/wise-owl" className="text-muted transition-colors hover:text-fg">
              Rates
            </Link>
            <Link to="/onboard" className="text-muted transition-colors hover:text-fg">
              Onboard
            </Link>
            <Link to="/" className="text-muted transition-colors hover:text-fg">
              Site
            </Link>
            <button
              type="button"
              className="text-muted transition-colors hover:text-fg"
              onClick={() => {
                signOutStudio();
                window.location.assign("/login");
              }}
            >
              Sign out
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        {children}
      </main>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-full px-2.5 text-xs font-medium capitalize",
        status === "active" && "bg-accent text-accent-fg",
        status === "onboarding" && "bg-raised text-fg",
        status === "paused" && "bg-raised text-muted",
        status === "completed" &&
          "bg-surface text-subtle outline outline-1 outline-line",
      )}
    >
      {status}
    </span>
  );
}

export const fieldClass =
  "h-11 w-full rounded-[10px] border border-line bg-surface px-3.5 text-sm text-fg outline-none transition-[border-color,box-shadow] duration-150 focus-visible:border-line-strong focus-visible:ring-2 focus-visible:ring-accent/30";
