import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CreditCard, Download } from "lucide-react";
import { InvoiceDocument } from "@/components/invoice-document";
import { OwlMark } from "@/components/logo";
import { studioCall } from "@/lib/studio-api";
import type { PublicInvoice } from "@/lib/studio-types";

type Search = { t?: string; session_id?: string };

/**
 * The client's invoice page. The link carries an unguessable token, so the
 * page works without a login. Static deploy: every token loads the same
 * prerendered page and fetches its invoice from /api/studio.
 */
export const Route = createFileRoute("/invoice")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    ...(typeof search.t === "string" ? { t: search.t } : {}),
    ...(typeof search.session_id === "string" ? { session_id: search.session_id } : {}),
  }),
  component: InvoicePage,
  head: () => ({
    meta: [
      { title: "Invoice · Wise Owl" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function InvoicePage() {
  const { t, session_id: sessionId } = Route.useSearch();
  const [data, setData] = useState<PublicInvoice | null>(null);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const [returned, setReturned] = useState(Boolean(sessionId));

  useEffect(() => {
    if (!t) {
      setError("This invoice link is missing its code. Check the link you were sent.");
      return;
    }
    let live = true;
    studioCall<PublicInvoice>("publicInvoice", { token: t, sessionId })
      .then((result) => {
        if (!live) return;
        setData(result);
        // Drop the Stripe session id from the address once it has been checked.
        if (sessionId) window.history.replaceState(null, "", `/invoice?t=${encodeURIComponent(t)}`);
      })
      .catch((err: unknown) => live && setError(err instanceof Error ? err.message : "Couldn’t load this invoice."));
    return () => {
      live = false;
    };
  }, [t, sessionId]);

  async function payByCard() {
    if (!t) return;
    setPaying(true);
    setPayError("");
    try {
      const { url } = await studioCall<{ url: string }>("payInvoice", { token: t });
      window.location.assign(url);
    } catch (err) {
      setPayError(err instanceof Error ? err.message : "Couldn’t open the card payment page.");
      setPaying(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg px-3 py-6 text-fg sm:px-6 sm:py-10">
      <div className="invoice-no-print mx-auto mb-5 flex max-w-3xl items-center justify-between gap-3">
        <a href="/" className="flex items-center gap-2 text-accent" aria-label="Wise Owl home">
          <OwlMark className="h-7 w-9" />
        </a>
        {data ? (
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex h-10 items-center gap-2 border-2 border-accent px-4 text-sm font-bold uppercase tracking-[0.06em] text-accent transition-colors [font-stretch:87.5%] hover:bg-tint"
          >
            <Download className="size-4" strokeWidth={2.25} aria-hidden="true" />
            Save as PDF
          </button>
        ) : null}
      </div>

      <div className="mx-auto max-w-3xl">
        {error ? (
          <div className="border-2 border-accent bg-surface px-6 py-10 text-center">
            <p className="text-xl font-black uppercase [font-stretch:112.5%]">Invoice not found</p>
            <p className="mt-2 text-muted">{error}</p>
          </div>
        ) : !data ? (
          <div className="space-y-3 border-2 border-accent/30 bg-surface p-8" aria-label="Loading invoice">
            <div className="h-8 w-40 animate-pulse bg-raised" />
            <div className="h-14 animate-pulse bg-raised" />
            <div className="h-40 animate-pulse bg-raised" />
          </div>
        ) : (
          <>
            {data.preview ? (
              <p className="invoice-no-print mb-3 border-2 border-dashed border-accent bg-surface px-4 py-2 text-sm">
                Draft preview. Only you can see this until the invoice is marked sent in the Studio.
              </p>
            ) : null}
            {returned ? (
              <p
                role="status"
                className="invoice-no-print mb-3 border-2 border-accent bg-accent px-4 py-3 text-sm font-semibold text-accent-fg"
              >
                {data.invoice.state === "paid"
                  ? "Payment received. Thank you!"
                  : "Thanks. Your card payment is processing and will show here shortly."}
                <button type="button" onClick={() => setReturned(false)} className="ml-3 underline">
                  Dismiss
                </button>
              </p>
            ) : null}
            <InvoiceDocument
              data={data}
              className="border-2 border-accent"
              payArea={
                data.cardPayments && data.invoice.balance_cents > 0 && !data.preview ? (
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => void payByCard()}
                      disabled={paying}
                      className="inline-flex h-12 items-center justify-center gap-2 bg-accent px-5 text-base font-extrabold uppercase tracking-[0.04em] text-accent-fg transition-[background-color,opacity] [font-stretch:87.5%] hover:bg-royal disabled:opacity-60"
                    >
                      <CreditCard className="size-5" strokeWidth={2.25} aria-hidden="true" />
                      {paying ? "Opening…" : "Pay by card"}
                    </button>
                    {payError ? (
                      <p role="alert" className="text-sm font-semibold text-[#a3141f]">
                        {payError}
                      </p>
                    ) : null}
                  </div>
                ) : null
              }
            />
          </>
        )}
      </div>
    </div>
  );
}
