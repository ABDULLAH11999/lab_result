import { ShieldAlert } from "lucide-react";
import { MEDICAL_DISCLAIMER } from "@/lib/constants";

export default function MedicalDisclaimer() {
  return (
    <div className="border-y border-sky-200/70 bg-white/60 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-start gap-3 px-4 py-3 text-sm text-sky-900 sm:px-6">
        <ShieldAlert className="icon-float mt-0.5 size-4 shrink-0 text-sky-700" />
        <p>{MEDICAL_DISCLAIMER}</p>
      </div>
    </div>
  );
}
