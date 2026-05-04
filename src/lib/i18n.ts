// Default embedded strings used as a fallback when backend translations fail to load.
// Any /control → app_translations change overrides these values in production.
export const defaultTranslations = {
  appTitle: "Tips & Tricks",
  appSubtitle: "OB/GYN & Fertility bedside companion",
  appCredential: "Obstetrics & Gynecology",
  searchPlaceholder: "Smart Search — handles typos & synonyms...",
  noResults: "No results found.",
  situation: "Situation",
  clinicalAction: "Clinical Action",
  patientScript: "Patient Script",
  discussAI: "Discuss with AI",
  askAI: "Ask anything about this clinical scenario...",
  askPlaceholder: "Ask about this scenario...",
  disclaimer: "Educational Use Only",
  disclaimerText1:
    "Tips & Tricks is an educational and academic reference for people interested in women's health, obstetrics, gynecology and fertility topics. It is NOT a medical device and does NOT provide diagnosis, treatment or emergency advice.",
  disclaimerText2:
    "Always consult a qualified healthcare professional for any personal medical concern. By continuing you confirm you understand this is for educational guidance only.",
  continueBtn: "I Understand — Continue",
  page: "Page",
  of: "of",
  "tab.clinic": "Clinic",
  "tab.or_labor": "OR / Labor",
  "tab.behavior": "Communication",
  "tab.qa": "Q&A Bank",
} as const;

export type TranslationKey = keyof typeof defaultTranslations;

/**
 * @deprecated Use useTranslations() from "@/hooks/useTranslations" for editable /control strings.
 * Kept as a backward-compatible shim for older code.
 */
export function t() {
  // Return the legacy nested tabs structure for compatibility.
  return {
    appTitle: defaultTranslations.appTitle,
    appSubtitle: defaultTranslations.appSubtitle,
    appCredential: defaultTranslations.appCredential,
    searchPlaceholder: defaultTranslations.searchPlaceholder,
    noResults: defaultTranslations.noResults,
    situation: defaultTranslations.situation,
    clinicalAction: defaultTranslations.clinicalAction,
    patientScript: defaultTranslations.patientScript,
    discussAI: defaultTranslations.discussAI,
    askAI: defaultTranslations.askAI,
    askPlaceholder: defaultTranslations.askPlaceholder,
    disclaimer: defaultTranslations.disclaimer,
    disclaimerText1: defaultTranslations.disclaimerText1,
    disclaimerText2: defaultTranslations.disclaimerText2,
    continueBtn: defaultTranslations.continueBtn,
    page: defaultTranslations.page,
    of: defaultTranslations.of,
    tabs: {
      clinic: defaultTranslations["tab.clinic"],
      or_labor: defaultTranslations["tab.or_labor"],
      behavior: defaultTranslations["tab.behavior"],
      qa: defaultTranslations["tab.qa"],
    },
  };
}
