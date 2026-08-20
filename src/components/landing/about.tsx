export function About() {
  return (
    <section id="about" className="scroll-mt-20">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-8 px-5 py-16 text-center sm:px-8 sm:py-24">
        <img
          src="/manuel.jpg"
          alt="Manuel Lorenzo Cruz"
          width={112}
          height={112}
          className="size-24 rounded-full object-cover object-top outline outline-1 -outline-offset-1 outline-fg/15 sm:size-28"
        />
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted">
            About
          </p>
          <h2 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
            Manuel Lorenzo Cruz
          </h2>
          <div className="mt-6 space-y-4 text-base leading-relaxed text-muted">
            <p>
              I’m a web designer with seven years of work on the sites people
              actually use — marketing pages, product sites, and the pages in
              between.
            </p>
            <p>
              Before that I spent fourteen years in video editing and
              production. It shows up in pacing and what I cut, not as a
              separate service. Wise Owl is web design. That’s the offer.
            </p>
            <p>If you already know what good looks like, we’ll get along.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
