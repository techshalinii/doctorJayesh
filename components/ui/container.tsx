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
  return <Tag className={cn("mx-auto w-full max-w-[1600px] px-5 sm:px-8 lg:px-12", className)}>{children}</Tag>;
}
