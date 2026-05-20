export default function DoctorQuestions({ questions }: { questions: string[] }) {
  return (
    <div className="space-y-3">
      {questions.map((question, index) => (
        <div key={question} className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
          {index + 1}. {question}
        </div>
      ))}
    </div>
  );
}
