import { createFileRoute, Link } from "@tanstack/react-router";
import { LOGO_OPTIONS } from "@/components/logo-options";

export const Route = createFileRoute("/logo")({ component: LogoOptions });

function LogoOptions() {
  return (
    <main className="min-h-screen bg-bg px-5 py-12 text-fg sm:px-8">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted">
          Identity options
        </p>
        <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
          Pick a mark.
        </h1>
        <p className="mt-4 max-w-xl text-muted">
          Four directions. None of these are on the site yet. Reply with A, B,
          C, or D — or tell me what to change.
        </p>
        <p className="mt-2 text-sm text-subtle">
          <Link to="/" className="underline-offset-4 hover:text-fg hover:underline">
            Back to the site
          </Link>
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {LOGO_OPTIONS.map(({ id, name, note, Mark }) => (
            <article
              key={id}
              className="rounded-[24px] border border-line bg-surface p-6 sm:p-8"
            >
              <p className="text-xs tabular-nums tracking-[0.18em] text-subtle">
                Option {id}
              </p>
              <h2 className="mt-1 font-display text-2xl">{name}</h2>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="grid place-items-center rounded-[20px] bg-bg py-8 text-accent">
                  <Mark className="size-20" />
                </div>
                <div className="grid place-items-center rounded-[20px] bg-accent py-8 text-accent-fg">
                  <Mark className="size-20" />
                </div>
              </div>
              <div className="mt-5 flex items-center gap-3 text-accent">
                <Mark className="size-8" />
                <span className="font-display text-xl leading-none">Wise Owl</span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted">{note}</p>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
