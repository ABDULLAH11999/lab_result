export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-syne text-4xl font-bold text-slate-950">Privacy Policy</h1>
      <div className="mt-6 space-y-5 text-slate-700">
        <p>Guest analyses are processed without being saved as reports. If you create an account and analyze while logged in, your saved reports are stored in the local application data store configured for this deployment.</p>
        <p>We collect only what is needed to run the service, support sign-in, respond to messages, and manage subscriptions if enabled. We do not sell your data.</p>
        <p>AI processing may send the pasted lab text to configured providers such as Groq or Gemini when those features are enabled by the operator.</p>
      </div>
    </div>
  );
}
