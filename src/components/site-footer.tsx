import { Link } from "@tanstack/react-router";
import { OwlMark } from "@/components/logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-5 py-10 text-center sm:px-8">
        <Link to="/" className="inline-flex items-center gap-2.5 text-fg">
          <OwlMark className="h-8 w-10 text-accent" />
          <span className="font-display text-xl leading-none">Wise Owl</span>
        </Link>
        <div className="max-w-sm text-sm text-muted">
          <p>Web Design by Manuel Lorenzo Cruz.</p>
          <p className="mt-1">Custom sites, built with care.</p>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-5 text-sm">
          <Link to="/onboard" className="text-muted transition-colors hover:text-fg">
            Client onboarding
          </Link>
          <a href="/login" className="text-muted transition-colors hover:text-fg">
            Studio
          </a>
        </nav>
        <p className="text-sm text-subtle">
          © {new Date().getFullYear()} Wise Owl
        </p>
      </div>
    </footer>
  );
}
