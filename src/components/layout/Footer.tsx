import Link from "next/link";
import { FlaskConical } from "lucide-react";
import { MEDICAL_DISCLAIMER } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="mt-20 bg-slate-950 text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-2xl bg-blue-600 p-2">
              <FlaskConical className="size-5" />
            </div>
            <span className="font-syne text-xl font-bold">LabExplain</span>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-300">{MEDICAL_DISCLAIMER}</p>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold text-white">Product</h3>
          <div className="space-y-2 text-sm text-slate-300">
            <Link href="/analyze" className="block hover:text-white">Analyze</Link>
            <Link href="/dashboard" className="block hover:text-white">Dashboard</Link>
            <Link href="/pricing" className="block hover:text-white">Pricing</Link>
            <Link href="/blog" className="block hover:text-white">Blog</Link>
          </div>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold text-white">Company</h3>
          <div className="space-y-2 text-sm text-slate-300">
            <Link href="/about" className="block hover:text-white">About</Link>
            <Link href="/contact" className="block hover:text-white">Contact</Link>
            <Link href="/privacy" className="block hover:text-white">Privacy</Link>
            <Link href="/terms" className="block hover:text-white">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
