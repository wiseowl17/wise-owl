import {
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { studio } from "@/lib/studio-api";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------ data hook */

export function useStudioData<T>(action: string, data?: Record<string, unknown>) {
  const [value, setValue] = useState<T | null>(null);
  const [error, setError] = useState("");
  const key = JSON.stringify(data ?? {});

  const reload = useCallback(async () => {
    try {
      const result = await studio<T>(action, JSON.parse(key) as Record<string, unknown>);
      setValue(result);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load.");
    }
  }, [action, key]);

  useEffect(() => {
    setValue(null);
    void reload();
  }, [reload]);

  return { value, error, reload };
}

/* --------------------------------------------------------------- layout */

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Panel({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-[14px] border border-line bg-surface", className)}>
      {title ? (
        <div className="flex min-h-12 items-center justify-between gap-3 border-b border-line px-4">
          <h2 className="text-sm font-semibold">{title}</h2>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function Empty({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <p className="max-w-sm text-sm text-muted">{children}</p>
      {action}
    </div>
  );
}

export function LoadState({ error, rows = 4 }: { error?: string; rows?: number }) {
  if (error) {
    return (
      <div className="rounded-[14px] border border-line bg-surface px-5 py-8 text-center">
        <p className="text-sm font-medium">Couldn’t load this.</p>
        <p className="mt-1 text-sm text-muted">{error}</p>
      </div>
    );
  }
  return (
    <div className="space-y-2" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-[10px] bg-raised/70" />
      ))}
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="px-4 py-4">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums tracking-tight">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-subtle">{hint}</p> : null}
    </div>
  );
}

const TONES: Record<string, string> = {
  lead: "bg-raised text-muted",
  onboarding: "bg-[#fff4d6] text-[#7a5200]",
  active: "bg-accent/10 text-accent",
  paused: "bg-raised text-muted",
  completed: "bg-[#e3f5ea] text-[#1c6b3c]",
  archived: "bg-raised text-subtle",
  proposal: "bg-raised text-muted",
  in_progress: "bg-accent/10 text-accent",
  review: "bg-[#fff4d6] text-[#7a5200]",
  launched: "bg-[#e3f5ea] text-[#1c6b3c]",
  on_hold: "bg-raised text-muted",
  cancelled: "bg-raised text-subtle line-through",
  paid: "bg-[#e3f5ea] text-[#1c6b3c]",
  pending: "bg-[#fff4d6] text-[#7a5200]",
  high: "bg-[#fde8e8] text-[#9b1c1c]",
};

export function Badge({ tone, children }: { tone: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center rounded-full px-2 text-xs font-medium whitespace-nowrap",
        TONES[tone] ?? "bg-raised text-muted",
      )}
    >
      {children}
    </span>
  );
}

/* ---------------------------------------------------------------- forms */

export const controlClass =
  "h-10 w-full rounded-[10px] border border-line bg-surface px-3 text-sm text-fg outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-subtle focus-visible:border-line-strong focus-visible:ring-2 focus-visible:ring-accent/25 disabled:opacity-60";

export function Field({
  label,
  htmlFor,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-xs font-medium text-muted">
        {label}
      </Label>
      {children}
      {hint ? <p className="text-xs text-subtle">{hint}</p> : null}
    </div>
  );
}

export function TextField({
  label,
  name,
  defaultValue,
  className,
  hint,
  ...props
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  className?: string;
  hint?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "defaultValue" | "name">) {
  const inputId = `f-${name}`;
  return (
    <Field label={label} htmlFor={inputId} hint={hint} className={className}>
      <Input
        id={inputId}
        name={name}
        defaultValue={defaultValue ?? ""}
        className="h-10 rounded-[10px] px-3"
        {...props}
      />
    </Field>
  );
}

export function SelectField({
  label,
  name,
  options,
  defaultValue,
  className,
  placeholder,
  ...props
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  defaultValue?: string | number | null;
  className?: string;
  placeholder?: string;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, "defaultValue" | "name">) {
  const inputId = `f-${name}`;
  return (
    <Field label={label} htmlFor={inputId} className={className}>
      <select
        id={inputId}
        name={name}
        defaultValue={
          props.value !== undefined ? undefined : defaultValue == null ? "" : String(defaultValue)
        }
        className={controlClass}
        {...props}
      >
        {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function AreaField({
  label,
  name,
  defaultValue,
  className,
  rows = 4,
  ...props
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  className?: string;
  rows?: number;
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "defaultValue" | "name">) {
  const inputId = `f-${name}`;
  return (
    <Field label={label} htmlFor={inputId} className={className}>
      <textarea
        id={inputId}
        name={name}
        rows={rows}
        defaultValue={defaultValue ?? ""}
        className={cn(controlClass, "h-auto min-h-20 py-2 leading-relaxed")}
        {...props}
      />
    </Field>
  );
}

/** Reads a submitted form into a plain object of strings. */
export function formValues(form: HTMLFormElement) {
  const out: Record<string, string> = {};
  new FormData(form).forEach((value, key) => {
    out[key] = String(value);
  });
  return out;
}

/* ---------------------------------------------------------------- sheet */

/**
 * Side panel for creating and editing records. Native <dialog> gives focus
 * trapping, Escape to close, and a real backdrop without a library.
 */
export function Sheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className="studio-sheet m-0 ml-auto h-dvh max-h-dvh w-full max-w-lg bg-bg p-0 text-fg shadow-[0_0_48px_rgba(21,37,107,0.18)] backdrop:bg-fg/30"
    >
      {open ? (
        <div className="flex h-full flex-col">
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-5">
            <h2 className="text-base font-semibold">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex size-9 items-center justify-center rounded-[8px] text-muted transition-colors hover:bg-raised hover:text-fg focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        </div>
      ) : null}
    </dialog>
  );
}

export function FormActions({
  pending,
  label,
  onDelete,
  deleteLabel = "Delete",
}: {
  pending: boolean;
  label: string;
  onDelete?: () => Promise<void> | void;
  deleteLabel?: string;
}) {
  return (
    <div className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-5">
      {onDelete ? <ConfirmButton onConfirm={onDelete}>{deleteLabel}</ConfirmButton> : <span />}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : label}
      </Button>
    </div>
  );
}

/** Two-step destructive button: first click arms it, second click runs it. */
export function ConfirmButton({
  onConfirm,
  children,
  size = "md",
}: {
  onConfirm: () => Promise<void> | void;
  children: ReactNode;
  size?: "sm" | "md";
}) {
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const timer = window.setTimeout(() => setArmed(false), 4000);
    return () => window.clearTimeout(timer);
  }, [armed]);

  return (
    <Button
      type="button"
      size={size}
      variant="ghost"
      disabled={busy}
      className={cn(armed ? "bg-[#fde8e8] text-[#9b1c1c] hover:bg-[#fbd5d5]" : "text-muted")}
      onClick={async () => {
        if (!armed) {
          setArmed(true);
          return;
        }
        setBusy(true);
        try {
          await onConfirm();
        } finally {
          setBusy(false);
          setArmed(false);
        }
      }}
    >
      {armed ? "Click again to confirm" : children}
    </Button>
  );
}
