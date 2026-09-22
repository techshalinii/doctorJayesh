import Image from "next/image";
import { cn } from "@/lib/utils";


export function DoctorPhoto({
  className,
  priority = false,
  sizes = "(min-width: 1024px) 40vw, 90vw",
}: {
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-gradient-to-b from-navy-50 to-teal-50 dark:from-navy-800 dark:to-navy-950",
        className,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-1/2 bg-grid opacity-40 dark:opacity-20" />
      <div className="absolute -right-10 top-6 h-40 w-40 rounded-full bg-teal-400/15 blur-3xl" />
      <Image
        src="/images/doctor.png"
        alt="Dr. Jayesh Sardhara, Neurosurgeon & Spine Surgeon"
        fill
        priority={priority}
        sizes={sizes}
        className="object-cover object-top scale-x-[-1] "
      />
    </div>
  );
}
