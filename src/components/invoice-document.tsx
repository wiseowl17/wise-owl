import type { ReactNode } from "react";
import { OwlMark } from "@/components/logo";
import { BUSINESS } from "@/lib/business";
import { formatDate, formatMoney } from "@/lib/money";
import { INVOICE_STATE_LABELS, label, type InvoiceItem, type PublicInvoice } from "@/lib/studio-types";
import { cn } from "@/lib/utils";

const labelClass = "text-[0.7rem] font-black uppercase tracking-[0.12em] text-accent [font-stretch:75%]";

function lineTotal(item: InvoiceItem) {
  return Math.round(Number(item.quantity) * item.unit_cents);
}

function qty(value: number | string) {
  const n = Number(value);
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

/**
 * The invoice itself, in the directory style: running head, INVOICE band,
 * billed-to and facts, line items, the reversed-out amount due, and a
 * dashed payment coupon. Prints to a single Letter page.
 */
export function InvoiceDocument({
  data,
  payArea,
  className,
}: {
  data: PublicInvoice;
  payArea?: ReactNode;
  className?: string;
}) {
  const { invoice, items, payments } = data;
  const paid = invoice.state === "paid";
  const due = invoice.due_on ? formatDate(invoice.due_on) : "Upon receipt";

  return (
    <article className={cn("invoice-doc bg-surface text-fg", className)}>
      <header className="flex flex-col gap-4 px-6 pt-8 pb-5 sm:flex-row sm:items-center sm:justify-between sm:px-10">
        <div className="flex items-center gap-3 text-accent">
          <OwlMark className="h-9 w-11" />
          <span className="text-xl font-black uppercase tracking-[0.04em] [font-stretch:125%]">{BUSINESS.name}</span>
        </div>
        <p className="text-xs leading-relaxed text-muted sm:text-right">
          <span className="font-bold text-fg">{BUSINESS.name}</span>, {BUSINESS.line.toLowerCase()}
          <br />
          {BUSINESS.person}
          <br />
          {BUSINESS.email}
          <br />
          {BUSINESS.site}
        </p>
      </header>

      <div className="flex items-baseline justify-between bg-accent px-6 py-3 text-accent-fg sm:px-10">
        <h1 className="text-[2.2rem] font-black uppercase leading-none tracking-[0.02em] [font-stretch:75%] sm:text-[2.6rem]">
          Invoice
        </h1>
        <p className="text-sm tracking-[0.04em] [font-stretch:87.5%]">
          No. {invoice.number}
          {invoice.state === "paid" || invoice.state === "void" || invoice.state === "overdue" ? (
            <span className="ml-3 inline-block bg-accent-fg px-2 py-0.5 text-xs font-black uppercase tracking-[0.08em] text-accent">
              {INVOICE_STATE_LABELS[invoice.state]}
            </span>
          ) : null}
        </p>
      </div>

      <div className="grid gap-8 px-6 pt-7 sm:grid-cols-[1.3fr_1fr] sm:px-10">
        <div>
          <p className={labelClass}>Billed to</p>
          <p className="mt-2 text-xl font-black uppercase leading-tight tracking-[0.01em] [font-stretch:125%]">
            {invoice.client_company || invoice.client_name}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            {invoice.client_company ? (
              <>
                {invoice.client_name}
                <br />
              </>
            ) : null}
            {invoice.client_address ? (
              <>
                {invoice.client_address}
                <br />
              </>
            ) : null}
            {invoice.client_email ?? invoice.client_website?.replace(/^https?:\/\//, "")}
          </p>
        </div>
        <dl className="self-start border-y-2 border-accent text-sm">
          {[
            ["Invoice", invoice.number],
            ["Issued", formatDate(invoice.issued_on)],
            ["Due", due],
          ].map(([k, v]) => (
            <div key={k} className="flex items-baseline gap-2 border-accent/20 py-2 [&+&]:border-t">
              <dt className="font-bold">{k}</dt>
              <span className="dir-leader" aria-hidden="true" />
              <dd className="tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="px-6 pt-8 sm:px-10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-accent">
              <th className={cn(labelClass, "pb-2 text-left")}>Description</th>
              <th className={cn(labelClass, "hidden pb-2 text-right sm:table-cell")}>Qty</th>
              <th className={cn(labelClass, "hidden pb-2 text-right sm:table-cell")}>Price</th>
              <th className={cn(labelClass, "pb-2 text-right")}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="border-b border-accent/20 align-top">
                <td className="py-3 pr-4">
                  <p className="text-[0.95rem] font-extrabold [font-stretch:112.5%]">{item.description}</p>
                  {item.details ? (
                    <p className="mt-1 whitespace-pre-line leading-relaxed text-muted">{item.details}</p>
                  ) : null}
                  {Number(item.quantity) !== 1 ? (
                    <p className="mt-1 text-xs text-muted tabular-nums sm:hidden">
                      {qty(item.quantity)} × {formatMoney(item.unit_cents)}
                    </p>
                  ) : null}
                </td>
                <td className="hidden py-3 pl-4 text-right tabular-nums sm:table-cell">{qty(item.quantity)}</td>
                <td className="hidden py-3 pl-4 text-right tabular-nums sm:table-cell">{formatMoney(item.unit_cents)}</td>
                <td className="py-3 pl-4 text-right font-bold tabular-nums">{formatMoney(lineTotal(item))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 ml-auto w-full sm:w-[62%]">
          <div className="flex items-baseline gap-2 py-1 text-sm">
            <span>Total</span>
            <span className="dir-leader" aria-hidden="true" />
            <span className="tabular-nums">{formatMoney(invoice.total_cents)}</span>
          </div>
          {payments.map((p, i) => (
            <div key={i} className="flex items-baseline gap-2 py-1 text-sm text-muted">
              <span>
                Paid {formatDate(p.paid_on, false)}, {label(p.method)}
              </span>
              <span className="dir-leader" aria-hidden="true" />
              <span className="tabular-nums">−{formatMoney(p.amount_cents)}</span>
            </div>
          ))}
          <div className="mt-2 flex items-center gap-3 bg-accent px-4 py-3 text-accent-fg">
            <span className="text-base font-black uppercase tracking-[0.02em] [font-stretch:125%] sm:text-lg">
              {paid ? "Paid in full" : "Amount due"}
            </span>
            <span className="dir-leader dir-leader-light" aria-hidden="true" />
            <span className="text-2xl font-black tabular-nums [font-stretch:112.5%]">
              {formatMoney(paid ? invoice.total_cents : invoice.balance_cents)}
            </span>
          </div>
        </div>

        {invoice.notes ? (
          <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-muted">{invoice.notes}</p>
        ) : null}

        {!paid && invoice.state !== "void" ? (
          <div className="mt-8 border-[3px] border-dashed border-accent p-1.5">
            <div className="grid gap-5 bg-bg px-5 py-4 sm:grid-cols-2">
              <div>
                <p className={labelClass}>How to pay</p>
                <p className="mt-1.5 text-sm leading-relaxed">{data.cardPayments ? BUSINESS.payNoteCard : BUSINESS.payNoteManual}</p>
                {payArea ? <div className="invoice-no-print mt-4">{payArea}</div> : null}
              </div>
              <div>
                <p className={labelClass}>Reference</p>
                <p className="mt-1.5 text-sm leading-relaxed">
                  Please include invoice number <b>{invoice.number}</b> with your payment. Thank you for the work.
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <footer className="mt-10 border-t-2 border-accent px-6 py-5 text-center text-xs leading-relaxed text-muted">
        <p className="font-bold text-fg">Web Design by Wise Owl.</p>
        <p>Custom sites, built with care.</p>
      </footer>
    </article>
  );
}
