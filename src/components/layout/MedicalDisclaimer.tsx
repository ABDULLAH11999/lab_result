import { ShieldAlert } from "lucide-react";
import { MEDICAL_DISCLAIMER } from "@/lib/constants";

export default function MedicalDisclaimer() {
  return (
    <div className="border-y border-sky-200 bg-sky-50">
      <div className="mx-auto flex max-w-6xl items-start gap-3 px-6 py-3 text-sm text-sky-900">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-sky-700" />
        <p>{MEDICAL_DISCLAIMER}</p>
      </div>
    </div>
  );
}
