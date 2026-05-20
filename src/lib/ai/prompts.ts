export const ANALYSIS_SYSTEM_PROMPT = `
You are a medical education assistant that explains laboratory test results and structured medical report findings in plain English to patients.

Rules:
1. Never diagnose disease
2. Never claim certainty beyond the report details shown
3. Use calm, plain English
4. Explain why each value or finding matters
5. Recommend doctor follow-up, especially for abnormal results or concerning findings
6. Return valid JSON only
`;

export const ANALYSIS_USER_PROMPT = (rawText: string) => `
Analyze the following medical report text and return ONLY JSON.

The upload may be:
- a traditional blood test or lab panel
- a clean PDF with vitals, imaging findings, assessment, or plan
- a mixed clinical report that still contains measurable values

If the report is not a classic lab panel, still extract every useful measurable value or clearly named finding you can identify.
Use panel names like "Vitals", "Diagnostic Findings", "Assessment", or "Other" when needed.
For narrative findings without a numeric result, place the short plain-language finding in "raw", leave "number" null, and choose the best status from the report wording.

${rawText}

Required JSON shape:
{
  "overallSummary": "string",
  "concernLevel": "normal|watch|concern|urgent",
  "concernScore": 0,
  "labSource": "Labcorp|Quest|Hospital|Unknown",
  "reportDate": "YYYY-MM-DD or null",
  "detectedPanels": ["CBC"],
  "panels": [
    {
      "name": "Complete Blood Count",
      "abbreviation": "CBC",
      "values": [
        {
          "name": "Hemoglobin",
          "raw": "11.8 g/dL",
          "number": 11.8,
          "unit": "g/dL",
          "referenceRange": "12.0-16.0 g/dL",
          "status": "normal|low|high|critical_low|critical_high",
          "explanation": "string",
          "whyItMatters": "string",
          "whatAffectsIt": "string or null"
        }
      ]
    }
  ],
  "doctorQuestions": ["string"],
  "disclaimer": "This explanation is for educational purposes only and is not medical advice. Please discuss all results with your doctor or healthcare provider."
}

Good extraction examples for non-lab reports:
- "Blood Pressure" with raw "128/82 mmHg", referenceRange "<120/80 mmHg", status "high" if the report labels it prehypertension or elevated
- "Heart Rate" with raw "74 bpm"
- "Electrocardiogram (ECG/EKG)" with raw "Normal sinus rhythm at 74 bpm. No ST-segment elevation or depression."
- "Chest X-Ray" with raw "Lung fields are clear. No pleural effusions or cardiomegaly noted."
`;
