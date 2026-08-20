import { ArrowDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-0 size-96 rounded-full bg-accent/10"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-16 bottom-0 size-64 rounded-full bg-accent/10"
      />

      <div className="relative mx-auto flex max-w-3xl flex-col items-center px-5 pb-16 pt-12 text-center sm:px-8 sm:pb-24 sm:pt-16">
        <div className="rise flex flex-col items-center gap-3">
          <img
            src="/manuel.jpg"
            alt="Manuel Lorenzo Cruz"
            width={96}
            height={96}
            className="size-16 rounded-full object-cover object-top outline outline-1 -outline-offset-1 outline-fg/15 sm:size-20"
          />
          <div>
            <p className="font-medium leading-tight">Manuel Lorenzo Cruz</p>
            <p className="text-sm text-muted">Web designer</p>
          </div>
        </div>

        <h1 className="rise rise-2 mt-8 font-display text-5xl leading-tight tracking-tight sm:text-6xl lg:text-7xl">
          Websites with a point of view.
        </h1>
        <p className="rise rise-3 mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
          I design custom sites for people who are done with templates. Seven
          years of web design — clear type, strong structure, nothing extra.
        </p>
        <div className="rise rise-4 mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <a href="#contact">
              Start a project
              <ArrowDownRight className="size-4" />
            </a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="#services">See services</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
