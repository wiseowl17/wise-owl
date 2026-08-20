import { createFileRoute } from "@tanstack/react-router";
import { About } from "@/components/landing/about";
import { Approach } from "@/components/landing/approach";
import { Contact } from "@/components/landing/contact";
import { Hero } from "@/components/landing/hero";
import { Process } from "@/components/landing/process";
import { Services } from "@/components/landing/services";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <div className="min-h-screen bg-bg text-fg">
      <SiteHeader />
      <main>
        <Hero />
        <Services />
        <Approach />
        <Process />
        <About />
        <Contact />
      </main>
      <SiteFooter />
    </div>
  );
}
