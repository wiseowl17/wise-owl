import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-[10px] border border-line bg-surface px-3.5 text-sm text-fg outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-subtle focus-visible:border-line-strong focus-visible:ring-2 focus-visible:ring-accent/25",
        className,
      )}
      {...props}
    />
  );
}
