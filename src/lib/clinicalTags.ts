/**
 * Clinical heuristics — turn raw scenario text into clinician-facing badges:
 *   • Urgency  (critical / urgent / routine)
 *   • Domain (OB / GYN / Fertility / Gyn Surgery / OB Emergency / OB Anesthesia)
 *   • Evidence level (A / B / C)
 *   • Time-to-read estimate (minutes)
 *
 * Pure functions, no I/O — safe to call in render. Designed to "just work"
 * on the existing medical_scenarios rows without any DB schema change.
 */

export type Urgency = "critical" | "urgent" | "routine";
export type Specialty = "OB" | "GYN" | "Fertility" | "Gyn Surgery" | "OB Emergency" | "OB Anesthesia";
export type EvidenceLevel = "A" | "B" | "C";

interface ScenarioLike {
  category: "clinic" | "or_labor" | "behavior" | "qa";
  title_en: string;
  situation_en?: string;
  action_en?: string;
  script_en?: string;
  synonyms?: string[] | null;
}

const blob = (s: ScenarioLike) =>
  [s.title_en, s.situation_en, s.action_en, s.script_en, (s.synonyms || []).join(" ")]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

/* ---------- Urgency ---------- */

const CRITICAL_KEYS = [
  "pph", "postpartum hemorrhage", "massive hemorrhage", "hemorrhagic shock",
  "eclampsia", "seizure", "shoulder dystocia", "cord prolapse",
  "amniotic fluid embolism", "afe", "uterine rupture", "uterine inversion",
  "cardiac arrest", "anaphylaxis", "sepsis", "septic shock",
  "respiratory arrest", "stroke", "dic", "code blue", "code pink",
  "fetal bradycardia", "category iii", "abruption", "placental abruption",
];

const URGENT_KEYS = [
  "preeclampsia", "severe", "hellp", "preterm labor", "pprom", "prom",
  "chorioamnionitis", "ectopic", "ovarian torsion", "tubo-ovarian abscess",
  "hyperstimulation", "ohss", "magnesium toxicity", "operative vaginal",
  "vacuum", "forceps", "third degree", "fourth degree", "obstructed labor",
  "fetal distress", "non-reassuring", "category ii", "vte", "pulmonary embolism",
  "dvt", "thyroid storm", "dka", "hypertensive crisis",
];

export function detectUrgency(s: ScenarioLike): Urgency {
  const t = blob(s);
  if (CRITICAL_KEYS.some((k) => t.includes(k))) return "critical";
  if (URGENT_KEYS.some((k) => t.includes(k))) return "urgent";
  // Behavior / Q&A categories default to routine
  return "routine";
}

/* ---------- Specialty ---------- */

const SPECIALTY_KEYS: Array<{ s: Specialty; keys: string[] }> = [
  { s: "OB Emergency", keys: ["emergency", "code blue", "arrest", "shock", "trauma", "pph", "eclampsia"] },
  { s: "OB Anesthesia", keys: ["anesthesia", "epidural", "spinal block", "intubation", "airway"] },
  { s: "Gyn Surgery", keys: ["c-section", "cesarean", "hysterectomy", "laparotomy", "laparoscopy", "myomectomy", "hysteroscopy", "tubal", "incision"] },
  { s: "Fertility", keys: ["fertility", "infertility", "ivf", "icsi", "ovulation", "ovarian reserve", "pcos"] },
  { s: "OB",        keys: ["pregnancy", "labor", "delivery", "antenatal", "postpartum", "fetal", "obstetric", "gestation", "trimester", "amniotic"] },
  { s: "GYN",       keys: ["gynecolog", "menstrual", "ovarian", "uterine fibroid", "endometr", "menopause", "contracept", "fertility"] },
];

export function detectSpecialty(s: ScenarioLike): Specialty {
  const t = blob(s);
  // OR/Labor → bias toward Surgery/OB
  if (s.category === "or_labor") {
    for (const grp of SPECIALTY_KEYS) {
      if (grp.s === "Gyn Surgery" || grp.s === "OB") {
        if (grp.keys.some((k) => t.includes(k))) return grp.s;
      }
    }
    return "Gyn Surgery";
  }
  for (const grp of SPECIALTY_KEYS) {
    if (grp.keys.some((k) => t.includes(k))) return grp.s;
  }
  return s.category === "clinic" ? "GYN" : "OB";
}

/* ---------- Evidence level ---------- */

// Heuristic: prefer A when widely-protocolized, B for common practice,
// C for behavior/communication scripts. Does NOT replace real grading.
export function detectEvidenceLevel(s: ScenarioLike): EvidenceLevel {
  const t = blob(s);
  if (s.category === "behavior") return "C";
  const A_HINTS = ["acog", "rcog", "who guideline", "level a", "grade a", "first-line", "recommended"];
  const B_HINTS = ["consider", "may", "evidence suggests", "studies", "level b", "grade b"];
  if (A_HINTS.some((k) => t.includes(k))) return "A";
  if (B_HINTS.some((k) => t.includes(k))) return "B";
  // Default for clinical/OR scenarios = B; QA defaults to B
  return s.category === "qa" ? "B" : "B";
}

/* ---------- Time-to-read ---------- */

// ~220 words/min; round to nearest minute, min 1, max 9.
export function detectReadMinutes(s: ScenarioLike): number {
  const text = [s.situation_en, s.action_en, s.script_en].filter(Boolean).join(" ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const min = Math.max(1, Math.min(9, Math.round(words / 220)));
  return min;
}

/* ---------- Composite ---------- */

export interface ClinicalTags {
  urgency: Urgency;
  specialty: Specialty;
  evidence: EvidenceLevel;
  readMin: number;
}

export function getClinicalTags(s: ScenarioLike): ClinicalTags {
  return {
    urgency: detectUrgency(s),
    specialty: detectSpecialty(s),
    evidence: detectEvidenceLevel(s),
    readMin: detectReadMinutes(s),
  };
}

/** Sort weight for "clinically most important first" ordering. */
export const URGENCY_WEIGHT: Record<Urgency, number> = {
  critical: 3,
  urgent: 2,
  routine: 1,
};

export const URGENCY_LABEL: Record<Urgency, string> = {
  critical: "Critical",
  urgent: "Urgent",
  routine: "Routine",
};
