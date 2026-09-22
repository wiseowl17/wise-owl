import { Link } from "@tanstack/react-router";
import { OwlMark } from "@/components/logo";

export function SiteFooter() {
  return (
    <footer className="border-t-2 border-accent bg-bg">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-5 px-4 py-10 text-center sm:px-6 lg:px-8">
        <OwlMark className="h-10 w-12 text-accent" />
        <div className="text-sm leading-relaxed">
          <p className="font-bold text-fg">Web Design by Wise Owl.</p>
          <p className="text-muted">Custom sites, built with care.</p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
          <a href="/#book" className="font-semibold text-accent hover:underline">
            Book a call
          </a>
          <Link to="/onboard" className="text-muted transition-colors hover:text-accent">
            Project brief
          </Link>
          <a href="/login" className="text-muted transition-colors hover:text-accent">
            Studio
          </a>
        </nav>
        <p className="text-xs text-subtle">© {new Date().getFullYear()} Wise Owl</p>
      </div>
    </footer>
  );
}
