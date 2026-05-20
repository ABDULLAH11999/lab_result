"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Camera,
  ClipboardPaste,
  FileImage,
  FileText,
  FlaskConical,
  Loader2,
  Sparkles,
  Upload
} from "lucide-react";

const SAMPLE_REPORT = `LABORATORY RESULTS
Patient: Jane Doe
Date: 2024-01-15
Lab: Quest Diagnostics

COMPLETE BLOOD COUNT
WBC: 7.2 K/uL (Reference: 4.5-11.0)
RBC: 4.1 M/uL (Reference: 3.8-5.1)
Hemoglobin: 11.8 g/dL (Reference: 12.0-16.0) LOW
MCV: 78.5 fL (Reference: 80.0-100.0) LOW
Platelets: 245 K/uL (Reference: 150-400)

COMPREHENSIVE METABOLIC PANEL
Glucose: 102 mg/dL (Reference: 70-99) HIGH
Creatinine: 0.82 mg/dL (Reference: 0.60-1.10)
ALT: 28 U/L (Reference: 7-40)

LIPID PANEL
Total Cholesterol: 218 mg/dL (Reference: <200) HIGH
LDL: 142 mg/dL (Reference: <100) HIGH
HDL: 52 mg/dL (Reference: >40)

THYROID
TSH: 3.8 uIU/mL (Reference: 0.4-4.0)`;

async function extractTextFromPdf(file: File) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjs.getDocument({ data: bytes }).promise;

  let combined = "";
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => ("str" in item ? item.str : ""))
      .join(" ");

    combined += `${pageText}\n`;
  }

  return combined.trim();
}

async function extractTextFromImage(file: File) {
  const Tesseract = await import("tesseract.js");
  const result = await Tesseract.recognize(file, "eng");
  return result.data.text.trim();
}

type AnalyzePageClientProps = {
  sampleEnabled?: boolean;
  embedded?: boolean;
  title?: string;
  description?: string;
};

export default function AnalyzePageClient({
  sampleEnabled = false,
  embedded = false,
  title = "Analyze Your Lab Results",
  description = "Paste the text from your report and we’ll explain the full picture in plain English."
}: AnalyzePageClientProps) {
  const [text, setText] = useState(sampleEnabled ? SAMPLE_REPORT : "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const router = useRouter();
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  async function submit() {
    if (text.trim().length < 20) {
      setError("Please paste your lab results first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: text })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || data.error || "Analysis failed.");
        return;
      }

      sessionStorage.setItem("lab_result", JSON.stringify(data));
      router.push(data.reportId ? `/results/${data.reportId}` : "/results/preview");
    } catch {
      setError("We could not reach the analyzer right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleFileSelection(file?: File | null) {
    if (!file) return;

    setUploading(true);
    setError("");
    setUploadMessage(`Reading ${file.name}...`);
    setUploadedFileName(file.name);

    try {
      let extracted = "";

      if (file.type.startsWith("text/")) {
        extracted = await file.text();
      } else if (file.type === "application/pdf") {
        setUploadMessage("Extracting text from your PDF...");
        extracted = await extractTextFromPdf(file);
      } else if (file.type.startsWith("image/")) {
        setUploadMessage("Reading your photo. This can take a moment...");
        extracted = await extractTextFromImage(file);
      } else {
        throw new Error("Please upload a PDF, image, or text file.");
      }

      if (!extracted.trim()) {
        throw new Error("We could not read text from that file. Try a clearer photo or paste the report text instead.");
      }

      setText(extracted.trim());
      setUploadMessage("Your report text is ready below. Review it, then press Explain My Lab Results.");
    } catch (uploadError: any) {
      setError(uploadError.message || "We could not read that file.");
      setUploadMessage("");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={embedded ? "" : "mx-auto max-w-4xl px-6 py-14"}>
      {!embedded ? (
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-3xl bg-blue-100">
            <FlaskConical className="size-8 text-blue-700" />
          </div>
          <h1 className="font-syne text-4xl font-bold text-slate-950">{title}</h1>
          <p className="mt-3 text-slate-600">{description}</p>
        </div>
      ) : null}

      <div className={`rounded-[28px] border border-slate-200 bg-white shadow-sm ${embedded ? "p-5 md:p-6" : "p-6"}`}>
        {embedded ? (
          <div className="mb-5">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              <Sparkles className="size-3.5" />
              Works with pasted text, uploaded PDFs, and phone photos
            </div>
            <h2 className="font-syne text-2xl font-bold text-slate-950">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          </div>
        ) : null}

        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={async () => {
              try {
                setText(await navigator.clipboard.readText());
                setUploadMessage("Pasted from your clipboard.");
              } catch {
                setError("Clipboard access was blocked. Please paste manually or use upload.");
              }
            }}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            <ClipboardPaste className="size-4" />
            Paste Report
          </button>

          <button
            type="button"
            onClick={() => uploadInputRef.current?.click()}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            <Upload className="size-4" />
            Upload File
          </button>

          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            <Camera className="size-4" />
            Scan With Camera
          </button>
        </div>

        <input
          ref={uploadInputRef}
          type="file"
          accept=".txt,.csv,application/pdf,image/*"
          className="hidden"
          onChange={(event) => void handleFileSelection(event.target.files?.[0])}
        />

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(event) => void handleFileSelection(event.target.files?.[0])}
        />

        <div className="mb-3 flex items-center justify-between gap-3">
          <label className="text-sm font-semibold text-slate-900">Lab report text</label>
          <button onClick={() => setText(SAMPLE_REPORT)} className="text-xs font-semibold text-blue-700">
            Use sample report
          </button>
        </div>

        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          className={`w-full rounded-3xl border border-slate-200 bg-slate-50 p-5 font-mono text-sm leading-7 text-slate-800 outline-none ring-0 ${embedded ? "h-72 md:h-80" : "h-96"}`}
          placeholder="You can paste the report text here, upload a PDF, or take a photo of the paper report."
        />

        <div className="mt-3 flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>
            {text.length
              ? `${text.length.toLocaleString()} characters ready`
              : "Best results come from clear photos and reports that include reference ranges"}
          </span>
          <span className="inline-flex items-center gap-2">
            <FileImage className="size-3.5" />
            Images
            <FileText className="size-3.5" />
            PDFs
          </span>
        </div>

        {uploading || uploadMessage ? (
          <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
            <div className="flex items-center gap-2">
              {uploading ? <Loader2 className="size-4 animate-spin" /> : <FlaskConical className="size-4" />}
              <span>{uploadMessage || "Working on your file..."}</span>
            </div>
            {uploadedFileName ? <p className="mt-1 text-xs text-blue-700">File: {uploadedFileName}</p> : null}
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 flex gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <p>{error}</p>
          </div>
        ) : null}

        <button
          onClick={submit}
          disabled={loading || uploading}
          className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-blue-600 px-6 py-4 text-lg font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Analyzing your results..." : "Explain My Lab Results"}
        </button>

        <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
          {[
            "Paste from MyChart, Quest, or Labcorp",
            "Upload a PDF or a photo of the paper report",
            "Get calm explanations and doctor questions"
          ].map((item) => (
            <div key={item} className="rounded-2xl bg-slate-50 p-3 text-center leading-5">
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
