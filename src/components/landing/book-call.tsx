import { useId, useState, type FormEvent } from "react";
import { ChevronDown, Phone } from "lucide-react";
import { Band } from "@/components/landing/band";
import { submitInquiry } from "@/lib/studio-client";
import { cn } from "@/lib/utils";

const times = ["Weekday mornings", "Weekday afternoons", "Weekday evenings", "Weekends", "Any time"];

type Sent = { name: string; business: string; phone: string; time: string };

/** Coupon fill-in rules: an underline to write on, which thickens on focus. */
const field =
  "h-11 w-full appearance-none rounded-none border-0 border-b-2 border-accent/75 bg-transparent px-0.5 text-lg text-fg outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-subtle hover:border-accent focus-visible:border-accent focus-visible:shadow-[0_2px_0_0_var(--color-accent)]";
const labelClass = "text-xs font-black uppercase tracking-[0.1em] text-accent [font-stretch:75%]";

/**
 * The call request, set as a directory coupon. When it goes through, the
 * coupon prints the request back as a new listing line.
 */
export function BookCall() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState<Sent | null>(null);
  const uid = useId();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const get = (key: string) => String(data.get(key) ?? "").trim();
    setPending(true);
    setError("");
    try {
      await submitInquiry({
        data: {
          name: get("name"),
          phone: get("phone"),
          email: get("email"),
          company: get("business"),
          bestTime: get("time"),
          message: get("message"),
          projectType: "Call request",
          fax: get("fax"),
        },
      });
      setSent({ name: get("name"), business: get("business"), phone: get("phone"), time: get("time") });
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That didn’t go through. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section aria-labelledby="book-title">
      <Band id="book" headingId="book-title" title="Book a call" seeAlso="Pick a time and I’ll call you" />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="border-[3px] border-dashed border-accent p-1.5">
          <div className="grid gap-8 bg-surface p-5 sm:p-8 lg:grid-cols-[1fr_1.4fr] lg:gap-12 lg:p-10">
            <div className="flex flex-col gap-4">
              <p className="text-[2.4rem] font-black uppercase leading-[0.95] tracking-[0.01em] text-accent [font-stretch:75%] sm:text-5xl">
                Tell me when to call.
              </p>
              <p className="max-w-[40ch] text-base leading-relaxed text-muted">
                A short call about your business and what the site needs to do, at the number and
                time you leave here.
              </p>
              <p className="mt-auto text-sm text-muted">
                Rather write it out? Start the{" "}
                <a href="/onboard" className="font-semibold text-accent underline decoration-2 underline-offset-4 hover:decoration-accent/40">
                  project brief
                </a>
                .
              </p>
            </div>

            {sent ? (
              <Printed sent={sent} onAgain={() => setSent(null)} />
            ) : (
              <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2" noValidate={false}>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor={`${uid}-name`} className={labelClass}>Your name</label>
                  <input id={`${uid}-name`} name="name" required autoComplete="name" className={field} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor={`${uid}-phone`} className={labelClass}>Phone</label>
                  <input
                    id={`${uid}-phone`}
                    name="phone"
                    type="tel"
                    required
                    autoComplete="tel"
                    inputMode="tel"
                    className={cn(field, "tabular-nums")}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor={`${uid}-business`} className={labelClass}>Business</label>
                  <input id={`${uid}-business`} name="business" autoComplete="organization" className={field} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor={`${uid}-time`} className={labelClass}>Best time to call</label>
                  <div className="relative">
                    <select id={`${uid}-time`} name="time" required defaultValue="" className={cn(field, "cursor-pointer pr-8")}>
                      <option value="" disabled>
                        Pick a time
                      </option>
                      {times.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      className="pointer-events-none absolute top-1/2 right-0.5 size-5 -translate-y-1/2 text-accent"
                      strokeWidth={2.5}
                      aria-hidden="true"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label htmlFor={`${uid}-email`} className={labelClass}>
                    Email <span className="font-medium normal-case tracking-normal text-muted">(optional)</span>
                  </label>
                  <input id={`${uid}-email`} name="email" type="email" autoComplete="email" className={field} />
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label htmlFor={`${uid}-message`} className={labelClass}>
                    What do you need? <span className="font-medium normal-case tracking-normal text-muted">(optional)</span>
                  </label>
                  <textarea
                    id={`${uid}-message`}
                    name="message"
                    rows={3}
                    className={cn(field, "h-auto min-h-24 py-3 leading-relaxed")}
                  />
                </div>
                {/* Honeypot: hidden from people, tempting to bots. */}
                <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
                  <label htmlFor={`${uid}-fax`}>Fax</label>
                  <input id={`${uid}-fax`} name="fax" tabIndex={-1} autoComplete="off" />
                </div>

                <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center">
                  <button
                    type="submit"
                    disabled={pending}
                    className="inline-flex h-14 items-center justify-center gap-3 bg-accent px-8 text-lg font-extrabold uppercase tracking-[0.04em] text-accent-fg transition-[background-color,transform,opacity] duration-150 [font-stretch:87.5%] hover:bg-royal active:scale-[0.98] disabled:opacity-60"
                  >
                    <Phone className="size-5" strokeWidth={2.25} aria-hidden="true" />
                    {pending ? "Sending…" : "Book a call"}
                  </button>
                  <p role="alert" className={cn("text-sm font-semibold text-[#a3141f]", !error && "sr-only")}>
                    {error}
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/** The sent request, printed back as a listing line. */
function Printed({ sent, onAgain }: { sent: Sent; onAgain: () => void }) {
  return (
    <div className="dir-print flex flex-col justify-center gap-5" role="status" aria-live="polite">
      <p className={labelClass}>Call request received</p>
      <div className="border-y-2 border-accent py-4">
        <p className="flex items-baseline gap-2 text-lg">
          <span className="font-extrabold text-fg">{sent.business || sent.name}</span>
          <span className="dir-leader" aria-hidden="true" />
          <span className="font-bold tabular-nums text-accent">{sent.phone}</span>
        </p>
        <p className="mt-1 text-sm text-muted">
          {sent.business ? `${sent.name}, ` : ""}
          {sent.time ? sent.time.toLowerCase() : "any time"}
        </p>
      </div>
      <p className="text-base leading-relaxed text-muted">
        Thanks, {sent.name.split(" ")[0]}. I’ll call you {sent.time ? sent.time.toLowerCase() : "soon"}.
      </p>
      <button
        type="button"
        onClick={onAgain}
        className="self-start text-sm font-semibold text-accent underline decoration-2 underline-offset-4 hover:decoration-accent/40"
      >
        Send another request
      </button>
    </div>
  );
}
