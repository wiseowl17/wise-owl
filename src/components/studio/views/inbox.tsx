import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ClientLink } from "@/components/studio/views/tasks";
import { ConfirmButton, Empty, LoadState, PageHeader, Panel, useStudioData } from "@/components/studio/ui";
import { studio } from "@/lib/studio-api";
import { formatDate } from "@/lib/money";
import type { Inbox, Inquiry } from "@/lib/studio-types";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "inquiries", label: "Contact form" },
  { key: "onboardings", label: "Onboarding briefs" },
  { key: "agreements", label: "Signed agreements" },
] as const;

type Tab = (typeof TABS)[number]["key"];

export function InboxView() {
  const { value: inbox, error, reload } = useStudioData<Inbox>("inbox");
  const [tab, setTab] = useState<Tab>("inquiries");

  const counts: Record<Tab, number> = {
    inquiries: inbox?.inquiries.filter((i) => !i.handled).length ?? 0,
    onboardings: inbox?.onboardings.length ?? 0,
    agreements: inbox?.agreements.length ?? 0,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inbox"
        description="Everything that came in from the public site. Briefs and agreements also create or update the client."
      />
      <div role="tablist" aria-label="Inbox" className="flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "-mb-px flex h-10 shrink-0 items-center gap-2 border-b-2 px-3 text-sm transition-colors",
              tab === t.key ? "border-accent font-medium text-fg" : "border-transparent text-muted hover:text-fg",
            )}
          >
            {t.label}
            {counts[t.key] ? (
              <span className="rounded-full bg-raised px-1.5 text-xs tabular-nums text-muted">{counts[t.key]}</span>
            ) : null}
          </button>
        ))}
      </div>

      {!inbox ? (
        <LoadState error={error} />
      ) : tab === "inquiries" ? (
        inbox.inquiries.length === 0 ? (
          <Panel>
            <Empty>No messages from the contact form yet.</Empty>
          </Panel>
        ) : (
          <div className="space-y-3">
            {inbox.inquiries.map((inquiry) => (
              <InquiryCard key={inquiry.id} inquiry={inquiry} onChanged={reload} />
            ))}
          </div>
        )
      ) : tab === "onboardings" ? (
        inbox.onboardings.length === 0 ? (
          <Panel>
            <Empty>No briefs yet. Send clients to /onboard after the first call.</Empty>
          </Panel>
        ) : (
          <Panel>
            <ul className="divide-y divide-line">
              {inbox.onboardings.map((o) => (
                <li key={o.id} className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 text-sm">
                    <p className="font-medium">
                      {o.client_id ? <ClientLink id={o.client_id}>{o.company || o.name}</ClientLink> : o.company || o.name}
                    </p>
                    <p className="text-xs text-muted">
                      {o.project_type} · {o.email} · {formatDate(o.created_at)}
                    </p>
                    <p className="mt-2 line-clamp-2 max-w-2xl text-muted">{o.goals}</p>
                  </div>
                  <ConfirmButton
                    size="sm"
                    onConfirm={async () => {
                      await studio("deleteOnboarding", { id: o.id });
                      reload();
                    }}
                  >
                    Delete
                  </ConfirmButton>
                </li>
              ))}
            </ul>
          </Panel>
        )
      ) : inbox.agreements.length === 0 ? (
        <Panel>
          <Empty>No signed agreements yet. They land here when a client signs the rates page.</Empty>
        </Panel>
      ) : (
        <Panel>
          <ul className="divide-y divide-line">
            {inbox.agreements.map((a) => (
              <li key={a.id} className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="text-sm">
                  <p className="font-medium">
                    {a.client_id ? <ClientLink id={a.client_id}>{a.company || a.name}</ClientLink> : a.company || a.name}
                  </p>
                  <p className="text-xs text-muted">
                    {a.project} · signed “{a.signature}” · {formatDate(a.signed_at)}
                  </p>
                </div>
                <ConfirmButton
                  size="sm"
                  onConfirm={async () => {
                    await studio("deleteAgreement", { id: a.id });
                    reload();
                  }}
                >
                  Delete
                </ConfirmButton>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}

function InquiryCard({ inquiry, onChanged }: { inquiry: Inquiry; onChanged: () => void }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  async function act(action: string, data: Record<string, unknown>) {
    setBusy(true);
    try {
      const result = await studio<{ clientId?: number }>(action, data);
      if (result?.clientId) {
        toast.success("Added as a lead.");
        await navigate({ to: "/studio", search: { view: "clients", id: result.clientId } });
        return;
      }
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel className={cn(inquiry.handled && "opacity-70")}>
      <div className="px-4 py-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
          <p className="text-sm font-medium">
            {inquiry.name}
            {inquiry.company ? <span className="font-normal text-muted"> · {inquiry.company}</span> : null}
          </p>
          <p className="text-xs text-muted">{formatDate(inquiry.created_at)}</p>
        </div>
        <p className="text-xs text-muted">
          <a href={`mailto:${inquiry.email}`} className="hover:text-accent">
            {inquiry.email}
          </a>
          {inquiry.project_type ? ` · ${inquiry.project_type}` : ""}
        </p>
        <p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm">{inquiry.message}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" disabled={busy} onClick={() => void act("inquiryToClient", { id: inquiry.id })}>
            Add as lead
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => void act("setInquiryHandled", { id: inquiry.id, handled: !inquiry.handled })}
          >
            {inquiry.handled ? "Mark as new" : "Mark handled"}
          </Button>
          <Button size="sm" variant="outline" asChild>
            <a href={`mailto:${inquiry.email}?subject=${encodeURIComponent("Your website project")}`}>Reply</a>
          </Button>
          <ConfirmButton
            size="sm"
            onConfirm={async () => {
              await studio("deleteInquiry", { id: inquiry.id });
              onChanged();
            }}
          >
            Delete
          </ConfirmButton>
        </div>
      </div>
    </Panel>
  );
}
