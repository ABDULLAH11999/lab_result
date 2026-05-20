export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-syne text-4xl font-bold text-slate-950">About LabExplain</h1>
      <div className="mt-6 space-y-5 text-slate-700">
        <p>LabExplain was built for the moment when a patient opens a portal, sees several values flagged high or low, and gets more anxiety than clarity.</p>
        <p>The goal is not to replace a doctor. The goal is to make people better prepared for that conversation by explaining each result, the bigger pattern, and the questions worth asking next.</p>
        <p>We designed the product around clear language, gentle tone, and strong guardrails. The app avoids diagnosis, keeps the medical disclaimer visible, and encourages follow-up with a healthcare professional every time.</p>
      </div>
    </div>
  );
}
