import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { Wordmark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/#services", label: "Services" },
  { href: "/#approach", label: "Approach" },
  { href: "/#about", label: "About" },
  { href: "/#contact", label: "Contact" },
  { href: "/studio.html", label: "Studio" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-md">
      <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-3 px-5 py-4 sm:px-8">
        <Link to="/" onClick={() => setOpen(false)}>
          <Wordmark />
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm text-muted transition-colors duration-150 hover:text-fg"
            >
              {item.label}
            </a>
          ))}
          <Button asChild size="sm">
            <a href="/#contact">Start a project</a>
          </Button>
        </nav>

        <button
          type="button"
          className="absolute right-4 top-3 inline-flex size-11 items-center justify-center rounded-[10px] text-fg md:hidden"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      <div
        className={cn(
          "border-t border-line bg-bg md:hidden",
          open ? "block" : "hidden",
        )}
      >
        <nav className="mx-auto flex max-w-6xl flex-col items-center gap-1 px-5 py-4 text-center">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex min-h-11 items-center text-base text-fg"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <Button asChild size="sm" className="mt-3">
            <a href="/#contact" onClick={() => setOpen(false)}>
              Start a project
            </a>
          </Button>
        </nav>
      </div>
    </header>
  );
}
