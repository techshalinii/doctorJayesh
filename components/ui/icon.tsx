import {
  Activity, Award, Baby, Bone, Brain, Cpu, Gauge, Globe2, HeartPulse, ScanEye,
  Scissors, Stethoscope, UserRound, type LucideIcon,
} from "lucide-react";

const map: Record<string, LucideIcon> = {
  Activity, Award, Baby, Bone, Brain, Cpu, Gauge, Globe2, HeartPulse, ScanEye,
  Scissors, Stethoscope, UserRound,
};

export function Icon({ name, className }: { name: string; className?: string }) {
  const Cmp = map[name] ?? Stethoscope;
  return <Cmp className={className} aria-hidden="true" />;
}
