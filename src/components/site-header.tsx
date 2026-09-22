import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, Phone, X } from "lucide-react";
import { Wordmark } from "@/components/logo";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/#work", label: "Work" },
  { href: "/#how", label: "How it works" },
  { href: "/#about", label: "About" },
  { href: "/login", label: "Studio" },
];

/** The directory's running head: mark on the left, guide links, the call action. */
export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b-2 border-accent bg-bg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Link to="/" onClick={() => setOpen(false)} aria-label="Wise Owl home">
          <Wordmark markClassName="h-7 w-9" />
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-muted transition-colors duration-150 [font-stretch:87.5%] hover:text-accent"
            >
              {item.label}
            </a>
          ))}
          <BookCallLink />
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <BookCallLink compact onClick={() => setOpen(false)} />
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center text-fg"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      <nav
        id="mobile-nav"
        aria-label="Main"
        className={cn("border-t border-accent/25 bg-bg md:hidden", open ? "block" : "hidden")}
      >
        <ul className="mx-auto max-w-7xl divide-y divide-accent/15 px-4">
          {nav.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="flex min-h-12 items-center text-sm font-semibold uppercase tracking-[0.08em] text-fg [font-stretch:87.5%]"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

function BookCallLink({ compact = false, onClick }: { compact?: boolean; onClick?: () => void }) {
  return (
    <a
      href="/#book"
      onClick={onClick}
      className={cn(
        "inline-flex h-10 items-center gap-2 whitespace-nowrap bg-accent px-4 text-sm font-bold uppercase tracking-[0.06em] text-accent-fg transition-[background-color,transform] duration-150 [font-stretch:87.5%] hover:bg-royal active:scale-[0.97]",
        compact && "h-9 gap-1.5 px-3 text-[0.8rem]",
      )}
    >
      <Phone className="size-4" strokeWidth={2.25} aria-hidden="true" />
      Book a call
    </a>
  );
}
