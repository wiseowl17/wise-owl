import { createFileRoute } from "@tanstack/react-router";
import { About } from "@/components/landing/about";
import { BookCall } from "@/components/landing/book-call";
import { Hero } from "@/components/landing/hero";
import { Process } from "@/components/landing/process";
import { Work } from "@/components/landing/work";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <div className="min-h-screen bg-bg text-fg">
      <SiteHeader />
      <main>
        <Hero />
        <Work />
        <Process />
        <About />
        <BookCall />
      </main>
      <SiteFooter />
    </div>
  );
}
