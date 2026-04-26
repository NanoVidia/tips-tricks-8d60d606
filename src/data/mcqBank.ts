// Curated OB/GYN MCQ seed bank — sourced from RCOG Green-top Guidelines,
// ACOG Practice Bulletins, and Williams Obstetrics. Kept in English only.

import type { ExamId, Topic, Difficulty } from "./examsData";

export interface MCQ {
  id: string;
  topic: Topic;
  difficulty: Difficulty;
  exams: ExamId[]; // exams this question is most relevant to (empty = generic)
  stem: string;
  options: string[]; // exactly 4
  answerIndex: number; // 0..3
  explanation: string;
  reference: string;
}

export const MCQ_BANK: MCQ[] = [
  // ===== ANTENATAL CARE =====
  {
    id: "anc-001",
    topic: "Antenatal Care",
    difficulty: "easy",
    exams: [],
    stem: "A 28-year-old G1P0 at 11 weeks attends her booking visit. Which of the following is the single most appropriate first-trimester screening test for fetal aneuploidy?",
    options: [
      "Maternal serum AFP alone",
      "Combined test: nuchal translucency + PAPP-A + free β-hCG",
      "Amniocentesis",
      "Quadruple test",
    ],
    answerIndex: 1,
    explanation: "The combined test (NT + PAPP-A + free β-hCG) between 11+0 and 13+6 weeks is the recommended first-trimester aneuploidy screen, with detection rate ~85% for trisomy 21 at 5% FPR.",
    reference: "RCOG / NICE NG201 Antenatal care",
  },
  {
    id: "anc-002",
    topic: "Antenatal Care",
    difficulty: "medium",
    exams: [],
    stem: "Routine antenatal anti-D prophylaxis for non-sensitised RhD-negative women is offered at:",
    options: [
      "12 weeks only",
      "20 weeks only",
      "28 weeks (single dose) or 28 + 34 weeks (two-dose regimen)",
      "Only after delivery",
    ],
    answerIndex: 2,
    explanation: "RAADP is offered as a single dose at 28 weeks or as a two-dose regimen at 28 and 34 weeks, plus postnatal anti-D within 72 h of delivery if the baby is RhD-positive.",
    reference: "RCOG Green-top 22; NICE TA156",
  },

  // ===== LABOUR & DELIVERY =====
  {
    id: "lab-001",
    topic: "Labour & Delivery",
    difficulty: "medium",
    exams: [],
    stem: "A multiparous woman at 39 weeks has a CTG showing late decelerations with reduced variability. The most appropriate immediate action is:",
    options: [
      "Continue observation",
      "Maternal repositioning, IV fluids, stop oxytocin, consider fetal scalp sampling or expedite delivery",
      "Increase oxytocin",
      "Perform vaginal examination only",
    ],
    answerIndex: 1,
    explanation: "Pathological CTG features mandate intrauterine resuscitation (left lateral position, IV fluids, stop oxytocin, oxygen if maternally hypoxic) and consideration of FBS or expedited delivery depending on stage.",
    reference: "NICE NG229 Intrapartum care; RCOG",
  },
  {
    id: "lab-002",
    topic: "Labour & Delivery",
    difficulty: "easy",
    exams: [],
    stem: "The active phase of the first stage of labour is generally defined as starting from cervical dilatation of:",
    options: ["2 cm", "4 cm", "6 cm", "8 cm"],
    answerIndex: 2,
    explanation: "Modern definitions (ACOG/WHO 2018) place the active phase from 6 cm onwards, recognising slower progress between 4–6 cm as still latent.",
    reference: "ACOG / WHO Labour Care Guide 2018",
  },

  // ===== POSTPARTUM & PPH =====
  {
    id: "pph-001",
    topic: "Postpartum & PPH",
    difficulty: "hard",
    exams: ["MRCOG2", "SCFHS", "DHA"],
    stem: "A woman has 1500 mL blood loss after vaginal delivery. Uterus is atonic. Bimanual compression and oxytocin infusion fail. Next pharmacological agent of choice is:",
    options: [
      "Methylergometrine 500 µg IM (avoid in hypertension)",
      "Carboprost (15-methyl PGF2α) 250 µg IM, repeat every 15 min up to 8 doses (avoid in asthma)",
      "Misoprostol 200 µg PO",
      "Tranexamic acid only",
    ],
    answerIndex: 1,
    explanation: "Standard escalation after oxytocin: ergometrine (if no HTN), then carboprost (avoid in asthma), then misoprostol. TXA 1 g IV should be given early but is adjunctive, not a substitute for uterotonics.",
    reference: "RCOG Green-top 52; WOMAN trial",
  },
  {
    id: "pph-002",
    topic: "Postpartum & PPH",
    difficulty: "medium",
    exams: [],
    stem: "Tranexamic acid for postpartum haemorrhage should ideally be given within:",
    options: ["1 hour", "3 hours", "6 hours", "12 hours"],
    answerIndex: 1,
    explanation: "WOMAN trial: TXA 1 g IV within 3 hours of birth reduces death due to bleeding. Beyond 3 h, benefit is lost.",
    reference: "WOMAN Trial 2017; RCOG GTG 52",
  },

  // ===== HYPERTENSIVE DISORDERS =====
  {
    id: "hyp-001",
    topic: "Hypertensive Disorders",
    difficulty: "medium",
    exams: [],
    stem: "First-line antihypertensive for severe hypertension in pregnancy (BP ≥160/110) according to NICE/RCOG is:",
    options: [
      "ACE inhibitor",
      "Labetalol (oral or IV)",
      "Atenolol",
      "Thiazide diuretic",
    ],
    answerIndex: 1,
    explanation: "Labetalol is first-line; nifedipine MR or IV hydralazine are alternatives. ACEi/ARBs and atenolol are contraindicated in pregnancy.",
    reference: "NICE NG133; RCOG",
  },
  {
    id: "hyp-002",
    topic: "Hypertensive Disorders",
    difficulty: "hard",
    exams: ["MRCOG2", "SCFHS"],
    stem: "A 34-week pregnant woman with severe pre-eclampsia develops a generalised tonic-clonic seizure. The first-line treatment is:",
    options: [
      "Diazepam 10 mg IV",
      "Phenytoin loading dose",
      "Magnesium sulphate 4 g IV loading then 1 g/h infusion",
      "Levetiracetam",
    ],
    answerIndex: 2,
    explanation: "MgSO4 is first-line for eclampsia (Magpie trial). Loading dose 4 g IV over 5–10 min, then 1 g/h infusion for 24 h after last seizure or delivery.",
    reference: "Magpie Trial; RCOG GTG 10A",
  },

  // ===== GDM =====
  {
    id: "gdm-001",
    topic: "Gestational Diabetes",
    difficulty: "medium",
    exams: [],
    stem: "Diagnostic threshold for gestational diabetes on 75 g OGTT (NICE) is:",
    options: [
      "Fasting ≥5.6 or 2-h ≥7.8 mmol/L",
      "Fasting ≥7.0 or 2-h ≥11.1 mmol/L",
      "Fasting ≥6.1 or 2-h ≥10.0 mmol/L",
      "HbA1c ≥6.5% only",
    ],
    answerIndex: 0,
    explanation: "NICE NG3: GDM diagnosed if fasting plasma glucose ≥5.6 mmol/L or 2-hour ≥7.8 mmol/L on 75 g OGTT.",
    reference: "NICE NG3 Diabetes in pregnancy",
  },

  // ===== MATERNAL-FETAL MEDICINE =====
  {
    id: "mfm-001",
    topic: "Maternal-Fetal Medicine",
    difficulty: "hard",
    exams: ["MRCOG2"],
    stem: "Twin-to-twin transfusion syndrome (TTTS) is treated optimally with:",
    options: [
      "Selective reduction",
      "Fetoscopic laser ablation of placental anastomoses",
      "Amnioreduction alone",
      "Expectant management",
    ],
    answerIndex: 1,
    explanation: "Eurofoetus trial: fetoscopic laser is superior to amnioreduction for stage II–IV TTTS at <26 weeks.",
    reference: "Eurofoetus 2004; RCOG GTG 51",
  },

  // ===== ONCOLOGY =====
  {
    id: "onc-001",
    topic: "Gynecologic Oncology",
    difficulty: "medium",
    exams: [],
    stem: "The strongest single risk factor for endometrial carcinoma is:",
    options: ["Smoking", "Unopposed oestrogen exposure", "Multiparity", "OCP use"],
    answerIndex: 1,
    explanation: "Unopposed oestrogen (obesity, anovulation, oestrogen-only HRT, tamoxifen) is the dominant risk. OCPs and parity are protective.",
    reference: "Berek & Novak's Gynecology",
  },
  {
    id: "onc-002",
    topic: "Gynecologic Oncology",
    difficulty: "easy",
    exams: [],
    stem: "Most common histologic type of ovarian cancer is:",
    options: [
      "Germ cell tumour",
      "Sex cord-stromal tumour",
      "High-grade serous epithelial carcinoma",
      "Clear cell carcinoma",
    ],
    answerIndex: 2,
    explanation: "High-grade serous epithelial carcinoma accounts for ~70% of ovarian cancers and is strongly associated with BRCA mutations.",
    reference: "Berek & Novak; ACOG",
  },

  // ===== REI =====
  {
    id: "rei-001",
    topic: "Reproductive Endocrinology & Infertility",
    difficulty: "medium",
    exams: [],
    stem: "Rotterdam criteria for PCOS require at least 2 of 3 features. Which is NOT one of them?",
    options: [
      "Oligo/anovulation",
      "Clinical or biochemical hyperandrogenism",
      "Polycystic ovaries on ultrasound",
      "Elevated fasting insulin",
    ],
    answerIndex: 3,
    explanation: "Rotterdam (2003): 2 of 3 — oligo/anovulation, hyperandrogenism, PCO morphology on US (≥12 follicles 2–9 mm or ovarian volume >10 mL). Insulin resistance is associated but not diagnostic.",
    reference: "Rotterdam ESHRE/ASRM 2003",
  },
  {
    id: "rei-002",
    topic: "Reproductive Endocrinology & Infertility",
    difficulty: "hard",
    exams: ["MRCOG2"],
    stem: "First-line ovulation induction agent for anovulatory PCOS in women trying to conceive is now:",
    options: ["Clomiphene citrate", "Letrozole", "Metformin", "Gonadotropins"],
    answerIndex: 1,
    explanation: "Letrozole is now first-line per ASRM/RCOG (2018+) — superior live birth rates vs clomiphene in PCOS (PPCOS II trial).",
    reference: "PPCOS II NEJM 2014; ASRM 2018",
  },

  // ===== CONTRACEPTION =====
  {
    id: "con-001",
    topic: "Contraception & Family Planning",
    difficulty: "easy",
    exams: [],
    stem: "Most effective form of emergency contraception (lowest failure rate) is:",
    options: [
      "Levonorgestrel 1.5 mg PO within 72 h",
      "Ulipristal acetate 30 mg PO within 120 h",
      "Copper IUD within 5 days of UPSI",
      "Oral combined pill (Yuzpe)",
    ],
    answerIndex: 2,
    explanation: "Copper IUD has failure rate <0.1%, far lower than oral methods. Effective up to 5 days after UPSI or earliest expected ovulation.",
    reference: "FSRH UK Guidance",
  },

  // ===== UROGYN =====
  {
    id: "uro-001",
    topic: "Urogynecology",
    difficulty: "medium",
    exams: [],
    stem: "First-line conservative management for stress urinary incontinence is:",
    options: [
      "Anticholinergic drugs",
      "Supervised pelvic floor muscle training (≥3 months)",
      "Mid-urethral sling",
      "Botox injection",
    ],
    answerIndex: 1,
    explanation: "Supervised PFMT for at least 3 months is first-line per NICE NG123. Surgery considered only if conservative therapy fails.",
    reference: "NICE NG123",
  },

  // ===== BENIGN GYN =====
  {
    id: "ben-001",
    topic: "Benign Gynecology",
    difficulty: "medium",
    exams: [],
    stem: "A 32-year-old has heavy menstrual bleeding and a uterus enlarged to 10-week size with multiple intramural fibroids. She wishes to preserve fertility. Best initial medical option is:",
    options: [
      "Hysterectomy",
      "Levonorgestrel-IUS (Mirena) — if uterine cavity not distorted",
      "GnRH agonist long-term",
      "Endometrial ablation",
    ],
    answerIndex: 1,
    explanation: "LNG-IUS is first-line medical therapy for HMB if cavity is suitable. Ablation and hysterectomy compromise fertility; long-term GnRH agonist is not maintenance therapy.",
    reference: "NICE NG88; RCOG",
  },

  // ===== ADOLESCENT / MENOPAUSE =====
  {
    id: "men-001",
    topic: "Adolescent & Menopause",
    difficulty: "easy",
    exams: [],
    stem: "A woman with intact uterus needs HRT for vasomotor symptoms. The correct regimen is:",
    options: [
      "Oestrogen alone",
      "Combined oestrogen + progestogen",
      "Progestogen alone",
      "Tibolone only if >65 years",
    ],
    answerIndex: 1,
    explanation: "Unopposed oestrogen in a woman with a uterus increases endometrial cancer risk; progestogen is required for endometrial protection.",
    reference: "NICE NG23",
  },

  // ===== ETHICS =====
  {
    id: "eth-001",
    topic: "Ethics & Communication",
    difficulty: "easy",
    exams: ["MRCOG3"],
    stem: "A 16-year-old attends alone requesting contraception and refuses to inform her parents. The Fraser/Gillick principle requires you to be satisfied that:",
    options: [
      "She has parental consent in writing",
      "She understands the advice, cannot be persuaded to inform parents, will likely have intercourse anyway, her physical/mental health may suffer without advice, and her best interests require treatment",
      "She is at least 18",
      "A second clinician is present",
    ],
    answerIndex: 1,
    explanation: "Fraser guidelines (UK) allow contraceptive advice to under-16s without parental consent if all five criteria are met.",
    reference: "Fraser Guidelines; GMC 0–18",
  },
];

import { MCQ_BANK_EXTRA } from "./mcqBankExtra";
import { MCQ_BANK_EXPANSION } from "./mcqBankExpansion";

// Combined bank used by the simulator and filter helper
export const ALL_MCQS: MCQ[] = [...MCQ_BANK, ...MCQ_BANK_EXTRA, ...MCQ_BANK_EXPANSION];

export const filterMCQs = (opts: {
  examId?: ExamId;
  topic?: Topic | "All";
  difficulty?: Difficulty | "All";
}): MCQ[] => {
  return ALL_MCQS.filter((q) => {
    if (opts.examId && q.exams.length > 0 && !q.exams.includes(opts.examId)) {
      // soft filter — generic questions (empty exams array) always pass
      return q.exams.length === 0;
    }
    if (opts.topic && opts.topic !== "All" && q.topic !== opts.topic) return false;
    if (opts.difficulty && opts.difficulty !== "All" && q.difficulty !== opts.difficulty) return false;
    return true;
  });
};
