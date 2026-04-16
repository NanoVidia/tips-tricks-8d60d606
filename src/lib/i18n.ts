export type Lang = "en" | "ar";

const translations = {
  en: {
    appTitle: "OB/GYN Reference",
    appSubtitle: "Clinical Quick Guide",
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
  },
  ar: {
    appTitle: "مرجع النساء والتوليد",
    appSubtitle: "دليل سريري سريع",
    searchPlaceholder: "بحث ذكي — يتعامل مع الأخطاء الإملائية...",
    noResults: "لا توجد نتائج.",
    situation: "الموقف",
    clinicalAction: "الإجراء السريري",
    patientScript: "نص المريض",
    discussAI: "مناقشة مع الذكاء الاصطناعي",
    askAI: "اسأل أي شيء عن هذا السيناريو السريري...",
    askPlaceholder: "اسأل عن هذا السيناريو...",
    disclaimer: "⚠️ تنبيه مهم",
    disclaimerText1: "هذه أداة مرجعية تعليمية للمتخصصين في الرعاية الصحية فقط ولا تقدم تشخيصاً طبياً أو توصيات علاجية أو نصائح سريرية.",
    disclaimerText2: "جميع القرارات السريرية يجب أن يتخذها ممارسون مؤهلون بناءً على تقييم المريض الفردي.",
    continueBtn: "أفهم — متابعة",
    page: "صفحة",
    of: "من",
    tabs: {
      clinic: "العيادة",
      or_labor: "العمليات / الولادة",
      behavior: "التواصل",
      qa: "بنك الأسئلة",
    },
  },
} as const;

export function t(lang: Lang) {
  return translations[lang];
}
