import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "gold";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-tight transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-navy-800 text-white shadow-soft hover:bg-navy-700 hover:-translate-y-0.5 hover:shadow-teal dark:bg-teal-500 dark:text-white dark:hover:bg-teal-400",
  secondary:
    "bg-white text-navy-800 ring-1 ring-navy-200 hover:ring-teal-400 hover:-translate-y-0.5 hover:shadow-soft dark:bg-white/5 dark:text-white dark:ring-white/15 dark:hover:ring-teal-400/60",
  ghost:
    "bg-transparent text-navy-800 hover:bg-navy-50 dark:text-white/80 dark:hover:bg-white/5",
  gold:
    "bg-gold-500 text-navy-950 shadow-soft hover:bg-gold-400 hover:-translate-y-0.5 hover:shadow-soft",
};

const sizes: Record<Size, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-4 text-base",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

export function Button({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: CommonProps & { href: string } & Omit<ComponentProps<typeof Link>, "href" | "className">) {
  return (
    <Link href={href} className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </Link>
  );
}

export function ButtonAction({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: CommonProps & ComponentProps<"button">) {
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
}
