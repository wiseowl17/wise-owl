import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Wordmark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  isStudioSignedIn,
  signInStudio,
  studioNextPath,
} from "@/lib/studio-auth";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Studio login — Wise Owl" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function LoginPage() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isStudioSignedIn()) return;
    window.location.replace(studioNextPath(readNext()));
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setPending(true);
    setError("");
    try {
      await signInStudio(
        String(data.get("email") ?? ""),
        String(data.get("password") ?? ""),
      );
      window.location.replace(studioNextPath(readNext()));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-bg px-5 py-16 text-center text-fg sm:px-8">
      <Link to="/">
        <Wordmark />
      </Link>
      <p className="mt-10 text-xs font-medium uppercase tracking-[0.22em] text-muted">
        Studio
      </p>
      <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
        Sign in.
      </h1>
      <p className="mt-4 max-w-sm text-sm text-muted">
        The book is private. Public pages stay open.
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-10 w-full max-w-sm rounded-[24px] bg-surface p-6 text-left sm:p-8"
      >
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            defaultValue="mlcruz9804@gmail.com"
            required
          />
        </div>
        <div className="mt-5 space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
        {error ? <p className="mt-4 text-sm text-accent">{error}</p> : null}
        <Button type="submit" disabled={pending} className="mt-6 w-full">
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}

function readNext() {
  if (typeof window === "undefined") return "/studio.html";
  return new URLSearchParams(window.location.search).get("next");
}
