import { LayoutTemplate, Monitor, RefreshCw } from "lucide-react";

const services = [
  {
    icon: Monitor,
    title: "Custom websites",
    body: "Marketing sites and product sites designed from scratch — not a theme with new colors.",
  },
  {
    icon: RefreshCw,
    title: "Redesigns",
    body: "A full visual and structural rebuild so the site still feels considered a year later.",
  },
  {
    icon: LayoutTemplate,
    title: "Landing pages",
    body: "Focused pages for a launch, offer, or campaign. One job. No clutter.",
  },
];

export function Services() {
  return (
    <section id="services" className="scroll-mt-20">
      <div className="mx-auto max-w-6xl px-5 py-16 text-center sm:px-8 sm:py-24">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted">
          Services
        </p>
        <h2 className="mx-auto mt-3 max-w-xl font-display text-4xl tracking-tight sm:text-5xl">
          Web design. That’s the work.
        </h2>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {services.map((service) => (
            <article
              key={service.title}
              className="flex flex-col items-center rounded-[24px] border border-line bg-surface p-6 sm:p-7"
            >
              <span className="grid size-11 place-items-center rounded-[12px] bg-raised text-accent">
                <service.icon className="size-5" strokeWidth={1.75} />
              </span>
              <h3 className="mt-5 font-display text-2xl tracking-tight">
                {service.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {service.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
