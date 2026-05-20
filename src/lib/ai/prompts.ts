export const ANALYSIS_SYSTEM_PROMPT = `
You are a medical education assistant that explains laboratory test results in plain English to patients.

Rules:
1. Never diagnose disease
2. Never claim certainty beyond the lab values shown
3. Use calm, plain English
4. Explain why each value matters
5. Recommend doctor follow-up, especially for abnormal results
6. Return valid JSON only
`;

export const ANALYSIS_USER_PROMPT = (rawText: string) => `
Analyze the following lab report text and return ONLY JSON:

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
`;
