const translations = {
  appTitle: "OB/GYN Reference",
  appSubtitle: "Under the supervision of Dr. Sahar Elkhodiry",
  appCredential: "Consultant in Obstetrics & Gynecology — Sultanate of Oman",
  searchPlaceholder: "Smart Search — handles typos & synonyms...",
  noResults: "No results found.",
  situation: "Situation",
  clinicalAction: "Clinical Action",
  patientScript: "Patient Script",
  discussAI: "Discuss with AI",
  askAI: "Ask anything about this clinical scenario...",
  askPlaceholder: "Ask about this scenario...",
  disclaimer: "Important Disclaimer",
  disclaimerText1: "This is an educational reference tool for healthcare professionals only and does not provide medical diagnosis, treatment recommendations, or clinical advice.",
  disclaimerText2: "All clinical decisions must be made by qualified practitioners based on individual patient assessment.",
  continueBtn: "I understand — Continue",
  page: "Page",
  of: "of",
  tabs: {
    clinic: "Clinic",
    or_labor: "OR / Labor",
    behavior: "Communication",
    qa: "Q&A Bank",
  },
} as const;

export function t() {
  return translations;
}
