import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A directory category band: full-width royal blue with the heading in white
 * condensed caps, and an optional "see also" cross-reference on the right.
 */
export function Band({
  id,
  headingId,
  as: Tag = "h2",
  title,
  seeAlso,
  animate = false,
}: {
  id?: string;
  headingId?: string;
  as?: "h1" | "h2" | "p";
  title: string;
  seeAlso?: ReactNode;
  animate?: boolean;
}) {
  return (
    <div id={id} className={cn("scroll-mt-16 bg-accent text-accent-fg", animate && "dir-wipe")}>
      <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6 sm:px-6 lg:px-8">
        <Tag id={headingId} className="text-[1.65rem] font-black uppercase leading-none tracking-[0.02em] [font-stretch:75%] sm:text-[2rem]">
          {title}
        </Tag>
        {seeAlso ? (
          <p className="text-[0.8rem] font-medium tracking-[0.02em] text-accent-fg/85 [font-stretch:87.5%]">
            {seeAlso}
          </p>
        ) : null}
      </div>
    </div>
  );
}
