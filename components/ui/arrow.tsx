import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Arrow({
  direction = "right",
  className,
}: {
  direction?: "left" | "right";
  className?: string;
}) {
  const Icon = direction === "left" ? ArrowLeft : ArrowRight;
  return (
    <Icon
      aria-hidden
      className={cn(
        "h-4 w-4 shrink-0 transition-transform duration-300 ease-out",
        direction === "left"
          ? "group-hover:-translate-x-1 group-focus-visible:-translate-x-1"
          : "group-hover:translate-x-1 group-focus-visible:translate-x-1",
        className,
      )}
    />
  );
}
