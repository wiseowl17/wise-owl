import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { Wordmark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signAgreement } from "@/lib/studio-client";
import { careFees, projects, setupFees, siteFees } from "@/lib/rates";

const fieldClass =
  "h-11 w-full rounded-[10px] border border-line bg-surface px-3.5 text-sm text-fg outline-none transition-[border-color,box-shadow] duration-150 focus-visible:border-line-strong focus-visible:ring-2 focus-visible:ring-accent/30";

export const Route = createFileRoute("/p/wise-owl")({
  component: RatesPage,
  head: () => ({
    meta: [
      { title: "Project rates — Wise Owl" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function RatesPage() {
  const [pending, setPending] = useState(false);
  const [signed, setSigned] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    if (!data.get("agree")) {
      toast.error("Check the box to sign.");
      return;
    }

    setPending(true);
    try {
      await signAgreement({
        data: {
          name: String(data.get("name") ?? ""),
          email: String(data.get("email") ?? ""),
          company: String(data.get("company") ?? ""),
          project: String(data.get("project") ?? ""),
          signature: String(data.get("signature") ?? ""),
        },
      });
      setSigned(true);
      form.reset();
      toast.success("Agreement signed.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not sign. Try again.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-3xl justify-center px-5 py-5 sm:px-8">
          <Wordmark />
        </div>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col items-center px-5 py-14 text-center sm:px-8 sm:py-20">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted">
          Private rates
        </p>
        <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
          What the work costs.
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
          This page is not on the public site. If you have the link, it’s for
          you. Onboarding is $100 or $250 — one fee, paid first. Then we build.
        </p>

        <Section kicker="Setup" title="Before the build">
          <FeeList items={setupFees} />
        </Section>

        <Section kicker="Sites" title="The site itself">
          <FeeList items={siteFees} />
        </Section>

        <Section kicker="Care" title="After launch">
          <FeeList items={careFees} />
        </Section>

        <section className="mt-16 w-full text-left">
          <p className="text-center text-xs font-medium uppercase tracking-[0.22em] text-muted">
            How payment works
          </p>
          <h2 className="mt-3 text-center font-display text-3xl tracking-tight sm:text-4xl">
            Pay how you pay.
          </h2>
          <div className="mt-8 space-y-4 rounded-[24px] bg-surface p-6 text-sm leading-relaxed text-muted sm:p-8">
            <p>
              The onboarding fee is{" "}
              <span className="font-medium text-fg">$100 or $250</span> — not
              both. $100 if you already own the domain. $250 if we shop for and
              connect one. Work does not start until that fee clears.
            </p>
            <p>
              The rest of the project is billed as agreed for that job. Split
              payments are available on request.
            </p>
            <p>
              I take credit, debit, Venmo, Cash App, Apple Pay, Zelle, cash, and
              bank transfer. If another method is easier, ask.
            </p>
            <p>
              A signed agreement is required before the build. Type your name
              below. That is your signature.
            </p>
          </div>
        </section>

        <section id="agreement" className="mt-16 w-full text-left">
          <p className="text-center text-xs font-medium uppercase tracking-[0.22em] text-muted">
            Agreement
          </p>
          <h2 className="mt-3 text-center font-display text-3xl tracking-tight sm:text-4xl">
            Service agreement
          </h2>
          <div className="mt-8 space-y-4 rounded-[24px] border border-line bg-surface p-6 text-sm leading-relaxed text-muted sm:p-8">
            <p className="text-fg">
              This is an agreement between you and Wise Owl, the web design
              studio of Manuel Lorenzo Cruz.
            </p>
            <ol className="list-decimal space-y-3 pl-5">
              <li>
                You are hiring Wise Owl for web design as described on this page
                and in any written scope we confirm after onboarding.
              </li>
              <li>
                The onboarding fee is either $100 or $250, never both. $100 if
                you already own the domain and I connect it. $250 if we shop for
                and connect a domain. It is paid first and is non-refundable
                once onboarding has begun. It covers kickoff, the brief,
                holding the dates, and the domain work in that option.
              </li>
              <li>
                Site prices are landing page $400; a 3–5 page site with booking,
                payments, and calendar sync $750; a larger site of 5+ pages from
                $1,200, priced to the project before work starts.
              </li>
              <li>
                Monthly care starts at $100 for basic edits and photos, and at
                $250 to maintain backend work such as client files or inventory.
                Care is billed monthly and can be stopped with written notice.
              </li>
              <li>
                Payment may be made by credit card, debit card, Venmo, Cash App,
                Apple Pay, Zelle, cash, or bank transfer. Split payments are
                available on request and must be agreed in writing.
              </li>
              <li>
                Remaining project balances are due on the schedule we set before
                build. The site is not handed off until the agreed balance is
                paid.
              </li>
              <li>
                You confirm you have the right to the text, photos, and marks
                you send. You own the finished site once it is paid in full.
                Wise Owl may show the work in a portfolio unless you ask
                otherwise in writing.
              </li>
              <li>
                Typing your name below is your electronic signature and has the
                same effect as signing on paper.
              </li>
            </ol>
          </div>
        </section>

        {signed ? (
          <div className="mt-10 w-full rounded-[24px] bg-surface px-6 py-10">
            <h2 className="font-display text-3xl tracking-tight">Signed.</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              I’ll follow up with next steps. If you have not sent the brief
              yet, do that now.
            </p>
            <div className="mt-6 flex justify-center">
              <Button asChild>
                <Link to="/onboard">Send the onboarding brief</Link>
              </Button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="mt-10 w-full rounded-[24px] bg-surface p-5 text-left sm:p-8"
          >
            <p className="mb-5 text-center text-sm text-muted">
              Sign to accept the rates and the agreement.
            </p>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full legal name</Label>
                <Input id="name" name="name" required autoComplete="name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input id="company" name="company" autoComplete="organization" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project">This agreement is for</Label>
                <select
                  id="project"
                  name="project"
                  required
                  defaultValue=""
                  className={fieldClass}
                >
                  <option value="" disabled>
                    Select one
                  </option>
                  {projects.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="signature">Type your full name to sign</Label>
                <Input
                  id="signature"
                  name="signature"
                  required
                  placeholder="Must match the name above"
                  className="font-display text-xl"
                />
              </div>
              <label className="flex items-start gap-3 text-sm text-muted sm:col-span-2">
                <input
                  type="checkbox"
                  name="agree"
                  required
                  className="mt-1 size-4 accent-accent"
                />
                <span>
                  I have read the rates and the service agreement. I agree to
                  pay the onboarding fee first ($100 or $250, not both). This
                  typed name is my signature.
                  signature.
                </span>
              </label>
            </div>
            <div className="mt-6 flex flex-col items-center gap-3">
              <Button type="submit" disabled={pending} size="lg">
                {pending ? "Signing…" : "Sign the agreement"}
              </Button>
              <p className="text-xs text-subtle">
                Dated automatically when you sign.
              </p>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}

function Section({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-16 w-full">
      <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted">
        {kicker}
      </p>
      <h2 className="mt-3 font-display text-3xl tracking-tight sm:text-4xl">
        {title}
      </h2>
      <div className="mt-8">{children}</div>
    </section>
  );
}

function FeeList({
  items,
}: {
  items: { title: string; price: string; body: string }[];
}) {
  return (
    <ul className="grid gap-4">
      {items.map((item) => (
        <li
          key={item.title}
          className="rounded-[24px] bg-surface px-6 py-6 text-left sm:flex sm:items-start sm:justify-between sm:gap-8"
        >
          <div>
            <h3 className="font-display text-2xl tracking-tight">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
          </div>
          <p className="mt-4 shrink-0 font-display text-3xl tracking-tight text-accent sm:mt-0">
            {item.price}
          </p>
        </li>
      ))}
    </ul>
  );
}
