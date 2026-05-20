const fs = require("fs");
const path = require("path");

const appUrl = "https://labexplain.online";
const output = path.join(process.cwd(), "data", "blogs.json");

const topics = [
  ["what-does-high-alt-mean", "What Does High ALT Mean on a Blood Test?", "high ALT liver, ALT elevated what does it mean, ALT blood test high", "Learn what a high ALT result often means, why doctors compare it with AST and bilirubin, and what questions to ask next."],
  ["low-hemoglobin-causes", "Low Hemoglobin Causes: What Your Blood Test May Be Showing", "low hemoglobin causes, hemoglobin low symptoms, what causes low hemoglobin", "A plain-English guide to low hemoglobin, possible causes, related CBC markers, and follow-up questions for your doctor."],
  ["tsh-levels-explained", "TSH Levels Explained in Plain English", "TSH levels explained, TSH normal range, what is TSH blood test", "Understand what TSH measures, why it changes, and how doctors usually read it with free T4 and symptoms."],
  ["cbc-blood-test-complete-guide", "CBC Blood Test Explained: A Complete Patient Guide", "CBC blood test explained, what is CBC blood test, complete blood count results", "A step-by-step guide to white cells, red cells, hemoglobin, hematocrit, platelets, and the common questions patients ask."],
  ["ldl-cholesterol-high", "High LDL Cholesterol: What It Means and What to Ask Your Doctor", "LDL cholesterol high, what to do if LDL is high, LDL 140 is that bad", "Understand why LDL is flagged, what it means in context, and how risk factors affect the conversation."],
  ["high-ast-blood-test", "High AST Blood Test Results: What They Can Mean", "high AST blood test, AST elevated meaning, what causes high AST", "A patient-friendly guide to AST, why it can rise, and why doctors often compare it with ALT and other liver tests."],
  ["alkaline-phosphatase-high", "High Alkaline Phosphatase (ALP): Liver, Bone, and Other Common Causes", "high alkaline phosphatase, ALP blood test high, alkaline phosphatase elevated", "See what a high ALP result can suggest and why context from GGT, bilirubin, and symptoms matters."],
  ["bilirubin-high-meaning", "High Bilirubin Meaning: What Your Lab Report May Be Telling You", "high bilirubin meaning, bilirubin blood test high, total bilirubin elevated", "Learn what bilirubin measures and why doctors interpret it with liver tests, gallbladder symptoms, and timing."],
  ["ggt-high-meaning", "High GGT Levels: What a GGT Blood Test Can Mean", "high GGT meaning, GGT blood test high, elevated GGT causes", "A simple explanation of GGT, common reasons it rises, and how it fits into the liver panel."],
  ["albumin-low-meaning", "Low Albumin: Common Reasons This Blood Test Comes Back Low", "low albumin meaning, albumin blood test low, causes of low albumin", "Understand what albumin does in the body and why nutrition, liver health, kidney issues, and inflammation can matter."],
  ["creatinine-high-meaning", "High Creatinine Meaning: What It May Say About Kidney Function", "creatinine high meaning, elevated creatinine causes, high creatinine blood test", "Learn what creatinine measures, why hydration and muscle mass can matter, and how eGFR adds context."],
  ["egfr-low-explained", "Low eGFR Explained: What This Kidney Number Usually Means", "low eGFR explained, eGFR low meaning, kidney blood test eGFR", "A patient-friendly explanation of eGFR, why it is estimated, and what doctors usually look at with creatinine."],
  ["bun-high-meaning", "High BUN Blood Test Meaning", "high BUN meaning, BUN blood test high, elevated blood urea nitrogen", "See what BUN measures and why dehydration, kidney function, and protein intake can affect it."],
  ["sodium-low-explained", "Low Sodium (Hyponatremia) on a Blood Test: What It May Mean", "low sodium blood test, hyponatremia explained, sodium low meaning", "Understand low sodium in plain English and why doctors care about symptoms, medications, and fluid balance."],
  ["potassium-high-explained", "High Potassium on a Blood Test: What to Know", "high potassium blood test, potassium high meaning, hyperkalemia explained", "Learn why potassium can be flagged, what false alarms look like, and why urgent follow-up can matter in some cases."],
  ["calcium-high-meaning", "High Calcium Blood Test Meaning", "high calcium blood test, calcium high meaning, hypercalcemia symptoms blood test", "A plain-English guide to calcium, related parathyroid testing, and common reasons doctors repeat the result."],
  ["glucose-high-fasting", "High Fasting Glucose: What a Borderline High Sugar Result Means", "high fasting glucose, fasting glucose 102 meaning, blood sugar test high", "See how doctors usually think about fasting glucose, repeat testing, and when A1C is added."],
  ["hba1c-levels-chart", "HbA1c Levels Explained: Ranges, Meaning, and Next Questions", "HbA1c levels explained, HbA1c 5.7 what does it mean, prediabetes HbA1c range", "Understand what A1C measures over time and how doctors use it with fasting glucose and symptoms."],
  ["insulin-high-meaning", "High Insulin Levels: What This Blood Test May Be Suggesting", "high insulin levels blood test, fasting insulin high meaning, insulin lab result explained", "Learn what fasting insulin can reflect and why it is interpreted together with glucose and A1C."],
  ["wbc-count-high", "High White Blood Cell Count: What It Can Mean", "high white blood cell count, WBC count high causes, elevated WBC meaning", "A simple guide to WBC results, infection patterns, inflammation, and when the differential matters."],
  ["wbc-low-explained", "Low White Blood Cell Count Explained", "low white blood cell count, WBC low meaning, leukopenia blood test", "Understand what low WBC can mean and why trends, medicines, and recent illness matter."],
  ["neutrophils-high", "High Neutrophils: What a Neutrophil Count Can Mean", "high neutrophils meaning, neutrophils blood test high, neutrophil count elevated", "Learn how neutrophils fit into the CBC differential and why bacterial infection is only one part of the story."],
  ["lymphocytes-high", "High Lymphocytes on a CBC: What Doctors Usually Consider", "high lymphocytes meaning, lymphocytes high blood test, lymphocyte count elevated", "A calm guide to lymphocyte results, viral illness patterns, and when more context is needed."],
  ["platelets-high-meaning", "High Platelets Meaning: What a Platelet Count May Show", "high platelets meaning, platelet count high causes, thrombocytosis blood test", "Understand why platelets rise and how inflammation, iron deficiency, and recovery states may contribute."],
  ["platelets-low-meaning", "Low Platelets on a Blood Test: What It May Mean", "low platelets meaning, platelet count low causes, thrombocytopenia blood test", "A patient-friendly explanation of low platelets, repeat testing, and why bleeding symptoms matter."],
  ["hematocrit-low-explained", "Low Hematocrit Explained: What It Means in a CBC", "low hematocrit meaning, hematocrit low blood test, low HCT explained", "See how hematocrit relates to hemoglobin and why both are often discussed together."],
  ["mcv-low-microcytic-anemia", "Low MCV Meaning: Small Red Blood Cells and What Doctors Look For", "low MCV meaning, microcytic anemia explained, MCV low blood test", "Learn what a low MCV usually points toward and why iron studies are often part of the follow-up."],
  ["mcv-high-macrocytosis", "High MCV Meaning: Large Red Blood Cells Explained", "high MCV meaning, macrocytosis blood test, MCV high causes", "Understand common reasons MCV runs high and why B12, folate, alcohol, and medication history matter."],
  ["ferritin-low-what-to-do", "Low Ferritin: What to Do and What to Ask Your Doctor", "low ferritin what to do, ferritin levels explained, low ferritin causes", "A straightforward guide to low ferritin, iron stores, anemia clues, and next-step questions."],
  ["ferritin-high-meaning", "High Ferritin Meaning: Inflammation, Iron, and Other Possibilities", "high ferritin meaning, ferritin test high, elevated ferritin causes", "Learn why ferritin can go up even when it is not simple iron overload, and what other labs matter."],
  ["iron-saturation-low", "Low Iron Saturation: What It Means on Iron Studies", "low iron saturation meaning, iron saturation low causes, transferrin saturation low", "Understand how iron saturation fits with ferritin, hemoglobin, and iron deficiency workups."],
  ["vitamin-d-deficiency-blood-test", "Low Vitamin D Blood Test Results: What They Mean", "vitamin D blood test low, vitamin D deficiency lab results, 25-OH vitamin D low", "A patient guide to low vitamin D, common symptoms, and how doctors usually follow it over time."],
  ["vitamin-b12-low-explained", "Low Vitamin B12 Explained: Symptoms, Labs, and Follow-Up", "low vitamin B12 meaning, B12 blood test low, vitamin B12 deficiency lab", "See what low B12 can affect and why CBC changes, numbness, and diet history often matter."],
  ["folate-low-meaning", "Low Folate Meaning on a Blood Test", "low folate blood test, folate deficiency meaning, folate lab low", "Understand what folate does and why it is often checked with B12 and blood count changes."],
  ["thyroid-t4-high-or-low", "Free T4 Explained: What High or Low Results May Mean", "free T4 explained, T4 blood test high or low, thyroid free T4 meaning", "A plain-English guide to free T4 and how it is usually interpreted alongside TSH."],
  ["free-t3-explained", "Free T3 Explained: What This Thyroid Lab Is Looking At", "free T3 explained, T3 blood test meaning, thyroid T3 high or low", "Learn when free T3 is measured and why it usually is not interpreted alone."],
  ["cholesterol-ratio-explained", "Cholesterol Ratio Explained in Plain English", "cholesterol ratio explained, total cholesterol HDL ratio meaning, cholesterol blood test ratio", "Understand what cholesterol ratios try to show and why doctors still focus on the full risk picture."],
  ["hdl-low-meaning", "Low HDL Meaning: Why This Cholesterol Number Matters", "low HDL meaning, HDL cholesterol low, how to raise HDL explained", "A patient-friendly explanation of low HDL and why it is discussed with LDL, triglycerides, and lifestyle."],
  ["triglycerides-high-meaning", "High Triglycerides Meaning: What This Lipid Result Can Show", "high triglycerides meaning, triglycerides blood test high, triglycerides elevated causes", "Learn what high triglycerides can reflect and why fasting status and metabolic health matter."],
  ["non-hdl-cholesterol-explained", "Non-HDL Cholesterol Explained", "non-HDL cholesterol explained, non HDL high meaning, cholesterol panel non HDL", "See what non-HDL cholesterol includes and why many clinicians use it as a risk marker."],
  ["ast-alt-ratio-explained", "AST/ALT Ratio Explained: Why Doctors Compare These Two Liver Numbers", "AST ALT ratio explained, AST ALT ratio meaning, liver enzyme ratio", "Understand why doctors compare AST and ALT together rather than reading one liver enzyme alone."],
  ["anemia-blood-test-explained", "Anemia Blood Test Explained: Which Labs Usually Matter Most", "anemia blood test explained, labs for anemia, what blood tests show anemia", "A practical guide to hemoglobin, hematocrit, ferritin, MCV, and the common patterns seen in anemia workups."],
  ["cmp-blood-test-explained", "CMP Blood Test Explained: What a Comprehensive Metabolic Panel Shows", "CMP blood test explained, comprehensive metabolic panel meaning, CMP lab results", "Understand the common chemistry tests in a CMP and how they connect to kidney, liver, and electrolyte health."],
  ["liver-panel-explained", "Liver Panel Explained: ALT, AST, ALP, Bilirubin, and Albumin", "liver panel explained, liver blood test results, ALT AST bilirubin albumin meaning", "A simple overview of the liver panel and how the pattern of results often matters more than one number."],
  ["kidney-function-blood-test-explained", "Kidney Function Blood Test Explained: Creatinine, eGFR, and BUN", "kidney function blood test explained, creatinine egfr bun meaning, kidney labs", "A patient guide to the kidney numbers most often discussed after routine blood work."],
  ["blood-test-reference-range-explained", "Reference Range Explained: Why a Flagged Lab Result Is Not the Whole Story", "reference range explained blood test, lab result high low meaning, blood test flagged result", "Understand what normal ranges really are, why mild flags happen, and how context changes interpretation."],
  ["annual-blood-work-explained", "Annual Blood Work Explained: CBC, CMP, Cholesterol, A1C, and Thyroid", "annual blood work explained, common routine blood tests, yearly lab results meaning", "A big-picture guide to the most common routine tests adults see during checkups."],
  ["labcorp-vs-quest-lab-results", "Labcorp vs Quest Lab Results: Why the Format Looks Different but the Questions Are Similar", "Labcorp vs Quest lab results, reading lab reports, patient portal blood test results", "Understand why labs may look different by provider and how to focus on the values that matter most."],
  ["doctor-questions-for-lab-results", "Best Questions to Ask Your Doctor About Blood Test Results", "questions to ask doctor about blood test results, lab results appointment questions, blood work follow up questions", "A practical list of calm, useful questions to bring to a lab follow-up appointment."],
  ["how-to-read-blood-test-report", "How to Read a Blood Test Report Without Feeling Overwhelmed", "how to read blood test report, understand lab results, how to read CBC CMP lipid panel", "A step-by-step reading guide for patients who want to make sense of high, low, and normal flags before the appointment."]
];

function sectionHtml(topicTitle, keywordLine, description) {
  return `
    <p>${topicTitle} is one of the most common questions people search after opening a patient portal and seeing a number flagged high or low. The challenge is that a single result rarely tells the whole story by itself. Doctors usually compare that result with the rest of the panel, your symptoms, your medicines, your age, and whether this is a one-time change or part of a longer trend.</p>
    <p>That is where a tool like LabExplain fits in. Instead of looking up one number at a time, the goal is to help patients understand the full report in plain English. That includes what the marker usually measures, why it matters in the body, what common reasons can push it high or low, and what follow-up questions make sense during the next appointment.</p>
    <h2>What this result usually measures</h2>
    <p>${description} In practice, clinicians usually avoid reading the number in isolation. They compare it with nearby tests in the same panel and with prior reports if those are available. A mild change often leads to a very different conversation than a large or repeated change.</p>
    <h2>Why context matters more than one number</h2>
    <p>Most blood test questions are really pattern questions. A low hemoglobin result means something different when ferritin is also low. A high ALT means something different when AST, bilirubin, and alkaline phosphatase are normal versus when several liver markers are elevated together. A borderline glucose may lead to one set of next steps, while an abnormal A1C can point the conversation in a different direction.</p>
    <p>Reference ranges also vary a little between laboratories. That means a result can be slightly outside range on one report and still not suggest the same level of concern it would if it were far outside range or changing quickly over time. That is one reason the same patient may see small differences between Labcorp, Quest, and hospital portals.</p>
    <h2>Common reasons doctors may look deeper</h2>
    <p>Doctors often ask whether the result matches symptoms, whether recent illness or dehydration could affect it, whether exercise or supplements may have changed it, and whether medications could be involved. They may repeat the test, order related labs, or simply follow the trend if the number is only mildly abnormal and the rest of the picture is stable.</p>
    <h2>Questions worth bringing to your appointment</h2>
    <ul>
      <li>How far outside the normal range is this result, and is it mild or significant?</li>
      <li>Does this result fit with any other labs on the same report?</li>
      <li>Should this test be repeated, and if so, when?</li>
      <li>Could any medicines, supplements, diet changes, or recent illness affect this number?</li>
      <li>Is there one value in this report that matters more than the others?</li>
    </ul>
    <h2>How LabExplain helps</h2>
    <p>LabExplain is designed for patients who want the whole report explained at once. Instead of bouncing between search tabs for ${keywordLine}, it groups values by panel, explains them in plain language, flags what looks normal or abnormal, and generates doctor questions you can actually use.</p>
    <p>LabExplain provides educational information only. This is NOT medical advice. Always discuss your results with your doctor or healthcare provider.</p>
  `;
}

const blogs = topics.map(([slug, title, keywords, description], index) => {
  const keywordList = keywords.split(",").map((value) => value.trim());
  return {
    id: `blog-${index + 1}`,
    slug,
    title,
    excerpt: description,
    cover: `/blog/${slug}.jpg`,
    keywords: keywordList,
    tags: [...new Set([...keywordList.map((value) => value.replace(/\s+/g, "-")), "lab-results", "blood-test-explained", "patient-education"])],
    seoTitle: title.length > 58 ? title : `${title} | LabExplain`,
    seoDescription: description,
    canonicalUrl: `${appUrl}/blog/${slug}`,
    publishedAt: "2026-05-20",
    content: sectionHtml(title, keywords, description)
  };
});

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(blogs, null, 2));
console.log(`Seeded ${blogs.length} blog posts to ${output}`);
