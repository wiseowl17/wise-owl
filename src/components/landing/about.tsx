import { Band } from "@/components/landing/band";

const facts = [
  { label: "Does", value: "Web design. Custom sites, redesigns, landing pages and monthly care." },
  { label: "Experience", value: "Seven years designing sites people use." },
  { label: "Before that", value: "Fourteen years editing video. It shows in the pacing and in what gets cut." },
  { label: "Works with", value: "You, directly. No account managers, no handoffs." },
];

/** Manuel's own listing entry: name set bold, details in agate rows. */
export function About() {
  return (
    <section aria-labelledby="about-title">
      <Band id="about" headingId="about-title" title="About" seeAlso="Listed under: Lorenzo Cruz" />
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 md:grid-cols-[auto_1fr] md:gap-12 lg:px-8 lg:py-12">
        <img
          src="/manuel.jpg"
          alt="Lorenzo Cruz"
          width={176}
          height={176}
          loading="lazy"
          className="size-32 rounded-full object-cover object-top outline-2 outline-offset-4 outline-accent sm:size-40 lg:size-44"
        />
        <div className="max-w-3xl">
          <h3 className="text-[2rem] font-black uppercase leading-none tracking-[0.01em] text-fg [font-stretch:112.5%] sm:text-[2.6rem]">
            Lorenzo Cruz
          </h3>
          <p className="mt-3 text-lg leading-relaxed text-muted">
            I build sites for people who run real businesses and don’t have time to babysit a
            website. If you already know what good looks like, we’ll get along.
          </p>
          <dl className="mt-6 divide-y divide-accent/20 border-y-2 border-accent">
            {facts.map((fact) => (
              <div key={fact.label} className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr] sm:gap-6">
                <dt className="text-xs font-black uppercase tracking-[0.1em] text-accent [font-stretch:75%] sm:pt-1">
                  {fact.label}
                </dt>
                <dd className="text-[0.95rem] leading-relaxed text-fg">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
