import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { Band } from "@/components/landing/band";
import { cn } from "@/lib/utils";

type Client = {
  name: string;
  trade: string;
  place: string;
  built: string;
  url: string;
  host: string;
  image: string;
  phone: string;
};

/** Real client sites. Screenshots in /public/work are captures of the live sites. */
const clients: Client[] = [
  {
    name: "Barkly’s",
    trade: "Pet grooming, boarding & daycare",
    place: "Charlotte area",
    built: "Online booking, services with a price table, a gallery and policies.",
    url: "https://www.barklysclt.com",
    host: "barklysclt.com",
    image: "/work/barklys.webp",
    phone: "/work/barklys-phone.webp",
  },
  {
    name: "Luz Reyher",
    trade: "Maternity & newborn photography",
    place: "Atlanta",
    built: "A bilingual site in English and Spanish, with sessions and inquiries.",
    url: "https://luzreyher.grok.me",
    host: "luzreyher.grok.me",
    image: "/work/luzreyher.webp",
    phone: "/work/luzreyher-phone.webp",
  },
  {
    name: "LightHill Studio",
    trade: "Photography studio",
    place: "",
    built: "Shoot booking, studio rentals, a gallery and FAQ.",
    url: "https://www.lighthillstudio.com",
    host: "lighthillstudio.com",
    image: "/work/lighthill.webp",
    phone: "/work/lighthill-phone.webp",
  },
  {
    name: "Eski Construction",
    trade: "Remodeling contractor",
    place: "Greater Atlanta",
    built: "Free-estimate requests, services, the process and a service area.",
    url: "https://www.eskiconstruction.com",
    host: "eskiconstruction.com",
    image: "/work/eski.webp",
    phone: "/work/eski-phone.webp",
  },
];

/**
 * Four display ads. Barkly's runs large with its phone view and Eski sits
 * narrow beside it; LightHill and Luz Reyher share the bottom row at equal
 * size. Screenshots are shown whole, never cropped.
 */
export function Work() {
  const [barklys, luz, lighthill, eski] = clients;
  return (
    <section aria-labelledby="work-title">
      <Band id="work" headingId="work-title" title="Sites I’ve built" seeAlso="Live sites. Click through and try them." />

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-6 lg:gap-8 lg:px-8 lg:py-12">
        <FeatureAd client={barklys} className="lg:col-span-4" />
        <PhoneAd client={eski} className="lg:col-span-2" />
        <StripAd client={lighthill} className="lg:col-span-3" />
        <StripAd client={luz} className="lg:col-span-3" />
      </div>
    </section>
  );
}

/** Name in expanded black, then the trade and place as one agate line under it. */
function AdTitle({ client, size }: { client: Client; size: "lg" | "md" }) {
  return (
    <div>
      <h3
        className={cn(
          "font-black uppercase leading-[0.95] tracking-[0.01em] text-fg [font-stretch:125%]",
          size === "lg" ? "text-[1.9rem] sm:text-[2.4rem]" : "text-[1.45rem] sm:text-[1.65rem]",
        )}
      >
        {client.name}
      </h3>
      <p className="mt-1.5 text-sm text-muted [font-stretch:87.5%]">
        {client.trade}
        {client.place ? `, ${client.place}` : ""}
      </p>
    </div>
  );
}

/** The site address set like a bold directory phone listing. */
function ListingLine({ client }: { client: Client }) {
  return (
    <a
      href={client.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group/visit flex min-h-11 items-center gap-2 border-t-2 border-accent pt-2 text-accent"
    >
      <span className="text-sm font-bold uppercase tracking-[0.06em] [font-stretch:87.5%]">Visit</span>
      <span className="dir-leader" aria-hidden="true" />
      <span className="font-black tracking-[0.01em] [font-stretch:112.5%] group-hover/visit:underline group-hover/visit:decoration-2 group-hover/visit:underline-offset-4">
        {client.host}
      </span>
      <ArrowUpRight
        className="size-4 shrink-0 transition-transform duration-200 group-hover/visit:-translate-y-0.5 group-hover/visit:translate-x-0.5"
        strokeWidth={2.5}
        aria-hidden="true"
      />
      <span className="sr-only">(opens {client.name} in a new tab)</span>
    </a>
  );
}

function Shot({ src, className }: { src: string; className?: string }) {
  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      className={cn("block w-full border border-accent/40 bg-surface object-cover object-top", className)}
    />
  );
}

/** Screenshot link: decorative duplicate of the listing line, so hidden from assistive tech. */
function ShotLink({ client, className, children }: { client: Client; className?: string; children: ReactNode }) {
  return (
    <a href={client.url} target="_blank" rel="noopener noreferrer" tabIndex={-1} aria-hidden="true" className={cn("block", className)}>
      {children}
    </a>
  );
}

const box = "group flex flex-col gap-4 border-2 border-accent bg-bg p-4 sm:p-5";

function FeatureAd({ client, className }: { client: Client; className?: string }) {
  return (
    <article className={cn(box, className)}>
      <AdTitle client={client} size="lg" />
      <ShotLink client={client} className="relative pb-8 pr-5 sm:pb-10 sm:pr-14">
        <Shot src={client.image} className="aspect-[16/10]" />
        <Shot
          src={client.phone}
          className="absolute right-0 bottom-0 aspect-[39/80] w-[26%] max-w-44 border-2 border-accent transition-transform duration-300 ease-out group-hover:-translate-y-2"
        />
      </ShotLink>
      <p className="max-w-[52ch] text-[0.95rem] leading-relaxed text-muted">{client.built}</p>
      <div className="mt-auto">
        <ListingLine client={client} />
      </div>
    </article>
  );
}

function PhoneAd({ client, className }: { client: Client; className?: string }) {
  return (
    <article className={cn(box, className)}>
      <AdTitle client={client} size="md" />
      {/* The narrow ad shows the site as it looks on a phone. */}
      <ShotLink client={client} className="mx-auto w-full max-w-[14rem]">
        <Shot
          src={client.phone}
          className="aspect-[1/2] transition-transform duration-300 ease-out group-hover:-translate-y-1"
        />
      </ShotLink>
      <p className="text-[0.95rem] leading-relaxed text-muted">{client.built}</p>
      <div className="mt-auto">
        <ListingLine client={client} />
      </div>
    </article>
  );
}

function StripAd({ client, className }: { client: Client; className?: string }) {
  return (
    <article className={cn(box, className)}>
      <ShotLink client={client}>
        <Shot src={client.image} className="aspect-[16/10] transition-transform duration-300 ease-out group-hover:-translate-y-1" />
      </ShotLink>
      <div className="flex flex-1 flex-col gap-3">
        <AdTitle client={client} size="md" />
        <p className="text-[0.95rem] leading-relaxed text-muted">{client.built}</p>
        <div className="mt-auto">
          <ListingLine client={client} />
        </div>
      </div>
    </article>
  );
}
