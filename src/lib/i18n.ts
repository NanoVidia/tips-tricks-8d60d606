// النصوص الافتراضية المُضمَّنة بالكود — تُستخدم كـ fallback عندما يفشل تحميل DB.
// أي تعديل في /control → app_translations يطغى على هذه القيم في الإنتاج.
export const defaultTranslations = {
  appTitle: "Tips & Tricks",
  appSubtitle: "Clinical bedside companion",
  appCredential: "Obstetrics & Gynecology",
  searchPlaceholder: "Smart Search — handles typos & synonyms...",
  noResults: "No results found.",
  situation: "Situation",
  clinicalAction: "Clinical Action",
  patientScript: "Patient Script",
  discussAI: "Discuss with AI",
  askAI: "Ask anything about this clinical scenario...",
  askPlaceholder: "Ask about this scenario...",
  disclaimer: "Important Disclaimer",
  disclaimerText1:
    "This is an educational reference tool for healthcare professionals only and does not provide medical diagnosis, treatment recommendations, or clinical advice.",
  disclaimerText2:
    "All clinical decisions must be made by qualified practitioners based on individual patient assessment.",
  continueBtn: "I understand — Continue",
  page: "Page",
  of: "of",
  "tab.clinic": "Clinic",
  "tab.or_labor": "OR / Labor",
  "tab.behavior": "Communication",
  "tab.qa": "Q&A Bank",
} as const;

export type TranslationKey = keyof typeof defaultTranslations;

/**
 * @deprecated استخدم useTranslations() من "@/hooks/useTranslations" بدلاً منها للحصول على نصوص قابلة للتعديل من /control.
 * تظل موجودة كـ shim للتوافق الخلفي مع الكود القديم.
 */
export function t() {
  // نُرجع نفس البنية القديمة (مع tabs المتداخلة) للتوافق.
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
