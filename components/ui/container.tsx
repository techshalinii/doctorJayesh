import { cn } from "@/lib/utils";
import type { ElementType, ReactNode } from "react";

export function Container({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}) {
  /**
   * Wider than Tailwind's max-w-7xl (1280px): the design this site is being matched to
   * runs its grids close to the viewport edge, and at 1280 the page read as a narrow
   * column floating in whitespace on any monitor above ~1600px. Capped rather than
   * full-bleed so ultra-wide displays don't stretch section grids indefinitely.
   */
  return <Tag className={cn("mx-auto w-full max-w-[1600px] px-5 sm:px-8 lg:px-12", className)}>{children}</Tag>;
}
