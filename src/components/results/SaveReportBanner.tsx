import Link from "next/link";

export default function SaveReportBanner() {
  return (
    <div className="rounded-3xl bg-blue-600 p-6 text-white">
      <h3 className="font-syne text-xl font-bold">Save your report history</h3>
      <p className="mt-2 text-sm text-blue-50">Create a free account to keep recent reports and track future results.</p>
      <Link href="/auth/signup" className="mt-4 inline-flex rounded-xl bg-white px-4 py-2 text-sm font-semibold text-blue-700">
        Sign up free
      </Link>
    </div>
  );
}
