import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  CheckSquare,
  ExternalLink,
  Folder,
  Inbox,
  LayoutDashboard,
  LogOut,
  Receipt,
  Users,
  Wallet,
} from "lucide-react";
import { OwlMark } from "@/components/logo";
import { signOutStudio } from "@/lib/studio-auth";
import { RATES_PATH } from "@/lib/rates";
import { cn } from "@/lib/utils";

export type StudioView =
  | "overview"
  | "clients"
  | "projects"
  | "payments"
  | "tasks"
  | "expenses"
  | "inbox";

const NAV: { view: StudioView; label: string; icon: typeof Users }[] = [
  { view: "overview", label: "Overview", icon: LayoutDashboard },
  { view: "clients", label: "Clients", icon: Users },
  { view: "projects", label: "Projects", icon: Folder },
  { view: "payments", label: "Payments", icon: Wallet },
  { view: "tasks", label: "Tasks", icon: CheckSquare },
  { view: "expenses", label: "Expenses", icon: Receipt },
  { view: "inbox", label: "Inbox", icon: Inbox },
];

export function StudioChrome({
  view,
  children,
}: {
  view: StudioView;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg text-fg lg:grid lg:grid-cols-[232px_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-line bg-surface lg:flex">
        <Link
          to="/studio"
          search={{ view: "overview" }}
          className="flex h-16 items-center gap-2.5 px-5"
        >
          <OwlMark className="h-7 w-9 text-accent" />
          <span className="text-[15px] font-semibold">Wise Owl Studio</span>
        </Link>
        <nav className="flex flex-1 flex-col gap-0.5 px-3 py-2" aria-label="Studio">
          {NAV.map((item) => (
            <Link
              key={item.view}
              to="/studio"
              search={{ view: item.view }}
              aria-current={view === item.view ? "page" : undefined}
              className={cn(
                "flex h-10 items-center gap-3 rounded-[10px] px-3 text-sm transition-colors duration-150",
                view === item.view
                  ? "bg-accent/10 font-medium text-accent"
                  : "text-muted hover:bg-raised hover:text-fg",
              )}
            >
              <item.icon className="size-4" strokeWidth={1.75} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-col gap-0.5 border-t border-line px-3 py-3">
          <a
            href={RATES_PATH}
            target="_blank"
            rel="noreferrer"
            className="flex h-9 items-center gap-3 rounded-[10px] px-3 text-sm text-muted transition-colors hover:bg-raised hover:text-fg"
          >
            <ExternalLink className="size-4" strokeWidth={1.75} />
            Rates page
          </a>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex h-9 items-center gap-3 rounded-[10px] px-3 text-sm text-muted transition-colors hover:bg-raised hover:text-fg"
          >
            <ExternalLink className="size-4" strokeWidth={1.75} />
            Public site
          </a>
          <SignOut className="flex h-9 items-center gap-3 rounded-[10px] px-3 text-sm text-muted transition-colors hover:bg-raised hover:text-fg" />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Link to="/studio" search={{ view: "overview" }} className="flex items-center gap-2">
            <OwlMark className="h-6 w-8 text-accent" />
            <span className="text-sm font-semibold">Studio</span>
          </Link>
          <SignOut className="inline-flex h-9 items-center gap-2 rounded-[8px] px-2 text-sm text-muted" />
        </div>
        <nav
          className="flex gap-1 overflow-x-auto px-3 pb-2 [scrollbar-width:none]"
          aria-label="Studio"
        >
          {NAV.map((item) => (
            <Link
              key={item.view}
              to="/studio"
              search={{ view: item.view }}
              aria-current={view === item.view ? "page" : undefined}
              className={cn(
                "flex h-9 shrink-0 items-center rounded-full px-3.5 text-sm",
                view === item.view ? "bg-accent text-accent-fg" : "text-muted",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        {children}
      </main>
    </div>
  );
}

function SignOut({ className }: { className: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        await signOutStudio();
        window.location.assign("/login");
      }}
    >
      <LogOut className="size-4" strokeWidth={1.75} />
      Sign out
    </button>
  );
}
