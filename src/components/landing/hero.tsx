import { ArrowDown, Phone } from "lucide-react";
import { OwlMark } from "@/components/logo";
import { Band } from "@/components/landing/band";

const listings = [
  { name: "Landing page", detail: "one focused page" },
  { name: "Small business site", detail: "3 to 5 pages" },
  { name: "Larger site", detail: "5 pages and up" },
  { name: "Redesign", detail: "new look, same address" },
  { name: "Monthly care", detail: "edits, photos, upkeep" },
];

/**
 * First viewport: the WEB DESIGN category band, Wise Owl's display ad across
 * two directory columns, and an agate column of service listings.
 */
export function Hero() {
  return (
    <section aria-labelledby="hero-title">
      <Band
        as="p"
        title="Web design"
        animate
        seeAlso={<>See also: Landing pages, Redesigns, Website care</>}
      />

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:grid-cols-3 lg:gap-8 lg:px-8 lg:py-10">
        {/* The display ad */}
        <article className="relative lg:col-span-2">
          <DoubleRule />
          <div className="relative flex h-full flex-col gap-7 p-6 sm:p-9 lg:p-11">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-accent">
                <OwlMark className="h-8 w-10 sm:h-12 sm:w-[3.75rem]" />
                <span className="whitespace-nowrap text-[1.35rem] font-black uppercase leading-none tracking-[0.03em] [font-stretch:125%] sm:text-[2rem]">
                  Wise Owl
                </span>
              </div>
              <figure className="flex shrink-0 flex-col items-center gap-1 text-center sm:flex-row sm:gap-3 sm:text-right">
                <img
                  src="/manuel.jpg"
                  alt="Lorenzo Cruz"
                  width={80}
                  height={80}
                  fetchPriority="high"
                  className="size-12 shrink-0 rounded-full sm:order-2 object-cover object-top outline-2 outline-offset-2 outline-accent sm:size-16"
                />
                <figcaption className="text-[0.7rem] leading-tight sm:order-1 sm:text-sm">
                  <span className="block font-bold text-fg">Lorenzo Cruz</span>
                  <span className="text-muted max-sm:sr-only">Web designer</span>
                </figcaption>
              </figure>
            </div>

            <h1
              id="hero-title"
              className="max-w-[18ch] text-[1.85rem] font-black leading-[1.04] tracking-[-0.015em] text-fg [font-stretch:125%] sm:text-[2.6rem] lg:text-[3.05rem]"
            >
              Custom websites for local businesses, built by one person.
            </h1>

            <p className="max-w-[46ch] text-base leading-relaxed text-muted sm:text-lg">
              Booking, payments and calendar sync built in. You work with me from the first call to
              launch, and after.
            </p>

            {/* The call action, set as the ad's reversed-out bold listing line. */}
            <a
              href="#book"
              className="group flex min-h-16 items-center gap-3 bg-accent px-5 text-accent-fg transition-[background-color,transform] duration-150 hover:bg-royal active:scale-[0.99] sm:px-6"
            >
              <span className="text-xl font-black uppercase leading-none tracking-[0.02em] [font-stretch:125%] sm:text-2xl">
                Book a call
              </span>
              <span className="dir-leader dir-leader-light" aria-hidden="true" />
              <span className="flex shrink-0 items-center gap-2 text-sm font-bold uppercase tracking-[0.06em] [font-stretch:87.5%]">
                <Phone
                  className="size-5 transition-transform duration-200 group-hover:-rotate-12"
                  strokeWidth={2.25}
                  aria-hidden="true"
                />
                <span className="max-sm:sr-only">Pick a time</span>
              </span>
            </a>

            <div className="-mt-3">
              <a
                href="#work"
                className="inline-flex items-center gap-1.5 text-sm font-bold uppercase tracking-[0.06em] text-accent [font-stretch:87.5%] hover:underline hover:decoration-2 hover:underline-offset-4"
              >
                Or see the work first
                <ArrowDown className="size-4" strokeWidth={2.25} aria-hidden="true" />
              </a>
            </div>
          </div>
        </article>

        {/* Agate column: the service listings */}
        <aside
          aria-labelledby="listings-title"
          className="flex flex-col self-start border-t-2 border-accent pt-4 lg:border-t-0 lg:border-l-2 lg:pt-0 lg:pl-8"
        >
          <h2
            id="listings-title"
            className="text-sm font-black uppercase tracking-[0.1em] text-accent [font-stretch:75%]"
          >
            What I build
          </h2>
          <ul className="mt-3 divide-y divide-accent/20 border-y border-accent/20">
            {listings.map((item) => (
              <li key={item.name} className="flex items-baseline gap-2 py-3 text-[0.95rem]">
                <span className="font-bold text-fg">{item.name}</span>
                <span className="dir-leader" aria-hidden="true" />
                <span className="text-right text-muted [font-stretch:87.5%]">{item.detail}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Every site is built for phones first. Sites of 3 pages or more come with booking,
            payments and a calendar that stays in sync.
          </p>
          <p className="mt-4 text-sm">
            <a
              href="/onboard"
              className="font-semibold text-accent underline decoration-2 underline-offset-4 hover:decoration-accent/40"
            >
              Already talked? Start your project brief
            </a>
          </p>
        </aside>
      </div>
    </section>
  );
}

/** The display ad's frame: two blue rules that draw in on load. */
function DoubleRule() {
  const rule = "pointer-events-none absolute bg-accent";
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {/* outer frame, 3px */}
      <span className={`${rule} dir-draw-x inset-x-0 top-0 h-[3px]`} />
      <span className={`${rule} dir-draw-x inset-x-0 bottom-0 h-[3px]`} />
      <span className={`${rule} dir-draw-y inset-y-0 left-0 w-[3px]`} />
      <span className={`${rule} dir-draw-y inset-y-0 right-0 w-[3px]`} />
      {/* inner hairline frame */}
      <span className="dir-print absolute inset-[7px] border border-accent/60" />
    </div>
  );
}
