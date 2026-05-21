import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
          color: "#0f172a",
          fontFamily: "Arial, sans-serif",
          padding: 48
        }}
      >
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            borderRadius: 36,
            background: "rgba(255,255,255,0.96)",
            border: "4px solid #bfdbfe",
            padding: 52,
            flexDirection: "column",
            justifyContent: "space-between"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <div
              style={{
                width: 88,
                height: 88,
                borderRadius: 24,
                background: "#2563eb",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 48,
                fontWeight: 700
              }}
            >
              L
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 54, fontWeight: 800 }}>LabExplain</div>
              <div style={{ fontSize: 24, color: "#475569" }}>Plain-English lab explanations</div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.02 }}>
              Understand Your Lab Results
            </div>
            <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.02, color: "#2563eb" }}>
              Without The Confusion
            </div>
            <div style={{ marginTop: 16, fontSize: 28, color: "#334155" }}>
              Paste text, upload PDFs, or scan a paper report.
            </div>
            <div style={{ fontSize: 28, color: "#334155" }}>
              Get plain-English explanations and better doctor questions.
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
