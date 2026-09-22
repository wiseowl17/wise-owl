import { Band } from "@/components/landing/band";

const steps = [
  { title: "Call", body: "We talk about your business and what the site needs to do." },
  {
    title: "Brief",
    body: "A ten-minute form, so I design from your facts instead of guesses.",
    link: { href: "/onboard", label: "See the brief" },
  },
  { title: "Design", body: "I design and build it. You see it and ask for changes before it goes live." },
  { title: "Launch", body: "Your domain connected, the site live, and every form tested." },
  { title: "Care", body: "Optional monthly care for edits, new photos and upkeep." },
];

/** How it works: five verbs across one ruled row, read left to right. */
export function Process() {
  return (
    <section aria-labelledby="how-title">
      <Band id="how" headingId="how-title" title="How it works" seeAlso="One person, start to finish" />
      <ol className="mx-auto grid max-w-7xl grid-cols-1 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-5 lg:px-8 lg:py-12">
        {steps.map((step, i) => (
          <li
            key={step.title}
            className="flex flex-col gap-2 border-t-2 border-accent py-5 sm:pr-6 lg:border-t-0 lg:border-l-2 lg:py-1 lg:pr-5 lg:pl-5 lg:first:border-l-0 lg:first:pl-0"
          >
            <span className="text-[2.6rem] font-black uppercase leading-none tracking-[0.01em] text-accent [font-stretch:75%]">
              <span className="sr-only">Step {i + 1}: </span>
              {step.title}
            </span>
            <p className="text-[0.95rem] leading-relaxed text-muted">{step.body}</p>
            {step.link ? (
              <a
                href={step.link.href}
                className="text-sm font-semibold text-accent underline decoration-2 underline-offset-4 hover:decoration-accent/40"
              >
                {step.link.label}
              </a>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
