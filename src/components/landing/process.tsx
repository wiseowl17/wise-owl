const steps = [
  {
    num: "01",
    title: "Brief",
    body: "You talk. I listen. Audience, constraints, and what success actually looks like.",
  },
  {
    num: "02",
    title: "Direction",
    body: "A visual and verbal north star before a single page is built. No surprise mid-project.",
  },
  {
    num: "03",
    title: "Build",
    body: "Design and production in one pass. Tight pages, real type, nothing leftover.",
  },
  {
    num: "04",
    title: "Launch",
    body: "Ship it clean. Hand off what you need. Then I get out of the way.",
  },
];

export function Process() {
  return (
    <section className="bg-accent text-accent-fg">
      <div className="mx-auto max-w-6xl px-5 py-16 text-center sm:px-8 sm:py-24">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-accent-fg/70">
          Process
        </p>
        <h2 className="mx-auto mt-3 max-w-xl font-display text-4xl tracking-tight sm:text-5xl">
          Four steps. No theatre.
        </h2>
        <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <article key={step.num}>
              <p className="font-display text-4xl text-accent-fg/45">{step.num}</p>
              <h3 className="mt-4 text-lg font-medium">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-accent-fg/75">
                {step.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
