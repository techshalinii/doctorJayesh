import Image from "next/image";
import { doctor } from "@/lib/data";
import { cn } from "@/lib/utils";

const LOGO_W = 192;
const LOGO_H = 192;

export function Logo({
  height = 40,
  className,
  priority = false,
}: {
  height?: number;
  className?: string;
  priority?: boolean;
}) {
  const width = Math.round((height * LOGO_W) / LOGO_H);

  return (
    <Image
      src="/logo.png"
      alt={doctor.name}
      width={width}
      height={height}
      priority={priority}
      className={cn("shrink-0 object-contain", className)}
      style={{ width, height }}
    />
  );
}
