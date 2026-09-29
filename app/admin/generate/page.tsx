import { doctor } from "@/lib/data";
import { Generator } from "@/components/admin/ai/generator";

export default function GeneratePage() {
  return <Generator defaultAuthor={doctor.name} />;
}
