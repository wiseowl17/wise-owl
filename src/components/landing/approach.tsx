const principles = [
  {
    title: "Hierarchy first",
    body: "If a visitor can’t tell what matters in two seconds, the design failed. I start there.",
  },
  {
    title: "Type that sounds like you",
    body: "Most sites fail at the headline. Voice and type come first; the system is built around them.",
  },
  {
    title: "Restraint",
    body: "If an element is not earning its place, it goes. Calm pages read as confident.",
  },
  {
    title: "Built to last",
    body: "No trend-chasing. The site should still feel right after launch week is over.",
  },
];

export function Approach() {
  return (
    <section id="approach" className="scroll-mt-20 bg-surface">
      <div className="mx-auto flex max-w-3xl flex-col items-center px-5 py-16 text-center sm:px-8 sm:py-24">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted">
          Approach
        </p>
        <h2 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
          Designed, not decorated.
        </h2>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
          Wise Owl is a one-person studio. You work with me — not a handoff
          chain. The standard is simple: the site should feel like it was meant
          to exist.
        </p>

        <ol className="mt-12 w-full divide-y divide-line border-y border-line">
          {principles.map((item, i) => (
            <li key={item.title} className="py-6">
              <span className="text-xs tabular-nums tracking-[0.18em] text-subtle">
                0{i + 1}
              </span>
              <h3 className="mt-2 font-medium">{item.title}</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
                {item.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
