import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitInquiry } from "@/lib/studio-client";

const types = [
  "New website",
  "Redesign",
  "Landing page",
  "Something else",
];

export function Contact() {
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    setPending(true);
    try {
      await submitInquiry({
        data: {
        name: String(data.get("name") ?? ""),
        email: String(data.get("email") ?? ""),
        company: String(data.get("company") ?? ""),
        projectType: String(data.get("projectType") ?? ""),
        message: String(data.get("message") ?? ""),
        },
      });
      setSent(true);
      form.reset();
      toast.success("Received. I’ll write back shortly.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not send. Try again.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <section id="contact" className="scroll-mt-20 bg-surface">
      <div className="mx-auto flex max-w-xl flex-col items-center px-5 py-16 text-center sm:px-8 sm:py-24">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted">
          Contact
        </p>
        <h2 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
          Tell me what you’re building.
        </h2>
        <p className="mt-5 text-base leading-relaxed text-muted">
          A few sentences is enough. If it’s a fit, I’ll reply with a clear next
          step. Already in? Use the{" "}
          <a href="/onboard" className="text-accent hover:underline">
            onboarding brief
          </a>
          .
        </p>

        <form
          onSubmit={onSubmit}
          className="mt-10 w-full rounded-[24px] bg-bg p-5 text-left sm:p-8"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
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
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="company">Company</Label>
              <Input id="company" name="company" autoComplete="organization" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="projectType">Project type</Label>
              <select
                id="projectType"
                name="projectType"
                required
                defaultValue=""
                className="h-11 w-full rounded-[10px] border border-line bg-surface px-3.5 text-sm text-fg outline-none transition-[border-color,box-shadow] duration-150 focus-visible:border-line-strong focus-visible:ring-2 focus-visible:ring-accent/30"
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
              <Label htmlFor="message">What do you need?</Label>
              <Textarea
                id="message"
                name="message"
                required
                minLength={12}
                placeholder="A new site, a redesign, a landing page — and anything I should know."
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col items-center gap-3">
            <Button type="submit" disabled={pending} size="lg">
              {pending ? "Sending…" : sent ? "Sent — another?" : "Send the brief"}
            </Button>
            <p className="text-xs text-subtle">I read every note.</p>
          </div>
        </form>
      </div>
    </section>
  );
}
