import Link from "next/link";
import { FlaskConical } from "lucide-react";
import { MEDICAL_DISCLAIMER } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.68),rgba(226,238,255,0.84))] text-slate-900 backdrop-blur-xl">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="mb-4 flex items-center gap-3">
            <div className="icon-float rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 p-2 text-white shadow-[0_14px_30px_rgba(37,99,235,0.22)]">
              <FlaskConical className="size-5" />
            </div>
            <span className="font-syne text-xl font-bold">LabExplain</span>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-600">{MEDICAL_DISCLAIMER}</p>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Product</h3>
          <div className="space-y-2 text-sm text-slate-600">
            <Link href="/analyze" className="block hover:text-slate-950">Analyze</Link>
            <Link href="/dashboard" className="block hover:text-slate-950">Dashboard</Link>
            <Link href="/pricing" className="block hover:text-slate-950">Pricing</Link>
            <Link href="/blog" className="block hover:text-slate-950">Blog</Link>
          </div>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Company</h3>
          <div className="space-y-2 text-sm text-slate-600">
            <Link href="/about" className="block hover:text-slate-950">About</Link>
            <Link href="/contact" className="block hover:text-slate-950">Contact</Link>
            <Link href="/privacy" className="block hover:text-slate-950">Privacy</Link>
            <Link href="/terms" className="block hover:text-slate-950">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
