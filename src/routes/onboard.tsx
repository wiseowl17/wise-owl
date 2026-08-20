import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitOnboarding } from "@/lib/studio-client";

const types = [
  "Landing page",
  "Site, 3–5 pages",
  "Larger site, 5+ pages",
  "Monthly care",
  "Something else",
];

const fieldClass =
  "h-11 w-full rounded-[10px] border border-line bg-surface px-3.5 text-sm text-fg outline-none transition-[border-color,box-shadow] duration-150 focus-visible:border-line-strong focus-visible:ring-2 focus-visible:ring-accent/30";

export const Route = createFileRoute("/onboard")({
  component: OnboardPage,
  head: () => ({
    meta: [{ title: "Onboard — Wise Owl" }],
  }),
});

function OnboardPage() {
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    setPending(true);
    try {
      await submitOnboarding({
        data: {
          name: String(data.get("name") ?? ""),
          email: String(data.get("email") ?? ""),
          company: String(data.get("company") ?? ""),
          website: String(data.get("website") ?? ""),
          projectType: String(data.get("projectType") ?? ""),
          goals: String(data.get("goals") ?? ""),
          audience: String(data.get("audience") ?? ""),
          timeline: String(data.get("timeline") ?? ""),
          budget: String(data.get("budget") ?? ""),
          extra: String(data.get("extra") ?? ""),
        },
      });
      setSent(true);
      form.reset();
      toast.success("Brief received. I’ll take it from here.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not send. Try again.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg text-fg">
      <SiteHeader />
      <main className="mx-auto flex max-w-xl flex-col items-center px-5 py-14 text-center sm:px-8 sm:py-20">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted">
          Client onboarding
        </p>
        <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
          Let’s start the site right.
        </h1>
        <p className="mt-5 text-base leading-relaxed text-muted">
          A short brief so I can design without guesswork. Ten minutes is
          plenty.
        </p>

        {sent ? (
          <div className="mt-10 w-full rounded-[24px] bg-surface px-6 py-10">
            <h2 className="font-display text-3xl tracking-tight">
              You’re on the book.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              I’ll read this and write back with a clear next step. If we’re
              already in motion, nothing else is needed today.
            </p>
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button asChild>
                <Link to="/">Back to the site</Link>
              </Button>
              <Button type="button" variant="outline" onClick={() => setSent(false)}>
                Send another
              </Button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="mt-10 w-full rounded-[24px] bg-surface p-5 text-left sm:p-8"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Your name</Label>
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
                <Input
                  id="company"
                  name="company"
                  autoComplete="organization"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Current site</Label>
                <Input
                  id="website"
                  name="website"
                  type="url"
                  placeholder="https://"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="projectType">What do you need?</Label>
                <select
                  id="projectType"
                  name="projectType"
                  required
                  defaultValue=""
                  className={fieldClass}
                >
                  <option value="" disabled>
                    Select one
                  </option>
                  {types.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="goals">What should this site do?</Label>
                <Textarea
                  id="goals"
                  name="goals"
                  required
                  minLength={12}
                  placeholder="Who it’s for, what should happen, what good looks like."
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="audience">Who is it for?</Label>
                <Input id="audience" name="audience" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeline">When do you want it?</Label>
                <Input
                  id="timeline"
                  name="timeline"
                  placeholder="This quarter"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget">Budget range</Label>
                <Input id="budget" name="budget" placeholder="$400–$1,200" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="extra">Anything else</Label>
                <Textarea
                  id="extra"
                  name="extra"
                  placeholder="References, must-haves, things you already know you don’t want."
                />
              </div>
            </div>
            <div className="mt-6 flex flex-col items-center gap-3">
              <Button type="submit" disabled={pending} size="lg">
                {pending ? "Sending…" : "Send the brief"}
              </Button>
              <p className="text-xs text-subtle">
                This lands in the studio book. I read every one.
              </p>
            </div>
          </form>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
