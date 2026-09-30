"use client";

import { usePathname } from "next/navigation";
import { Container } from "@/components/ui/container";
import { mapEmbed } from "@/lib/data";

const HIDDEN_ON = new Set(["/"]);

export function FooterMap() {
  const pathname = usePathname();
  if (HIDDEN_ON.has(pathname)) return null;

  return (
    <div className="border-t border-border">
      <Container className="py-10">
        <h3 className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-teal-700 dark:text-teal-300">
          Find the Clinic
        </h3>
        <div className="mt-5 aspect-[16/9] w-full overflow-hidden border border-navy-900/10 bg-surface-2 sm:aspect-[21/9] dark:border-white/10">
          <iframe
            src={mapEmbed.src}
            title={mapEmbed.title}
            aria-label={mapEmbed.title}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-full w-full border-0"
          />
        </div>
      </Container>
    </div>
  );
}
