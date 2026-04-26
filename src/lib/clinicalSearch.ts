import { detectUrgency, URGENCY_WEIGHT } from "@/lib/clinicalTags";

type ScenarioCategory = "clinic" | "or_labor" | "behavior" | "qa";

export interface SearchScenario {
  id: string;
  category: ScenarioCategory;
  title_en: string;
  situation_en: string;
  action_en: string;
  script_en: string;
  synonyms: string[] | null;
}

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "of", "for", "to", "in", "on", "at", "by", "is", "are",
  "with", "from", "as", "be", "this", "that", "it", "its", "into", "over", "under", "what", "how",
]);

export type ClinicalVisualId = "pph" | "eclampsia" | "shoulder" | "cord" | "preterm" | "ectopic" | "vte" | "screening";

export interface TrustedClinicalVisual {
  id: ClinicalVisualId;
  label: string;
  reference: string;
}

const TRUSTED_VISUALS: Array<TrustedClinicalVisual & { keys: string[] }> = [
  { id: "pph", label: "PPH protocol", reference: "WHO · Postpartum haemorrhage recommendations", keys: ["pph", "postpartum hemorrhage", "postpartum haemorrhage", "uterine atony"] },
  { id: "eclampsia", label: "Eclampsia pathway", reference: "ACOG · Hypertension in pregnancy guidance", keys: ["eclampsia", "preeclampsia", "magnesium sulfate", "seizure"] },
  { id: "shoulder", label: "Shoulder dystocia", reference: "RCOG · Shoulder dystocia guideline", keys: ["shoulder dystocia", "mcroberts", "suprapubic pressure"] },
  { id: "cord", label: "Cord prolapse", reference: "RCOG · Umbilical cord prolapse guideline", keys: ["cord prolapse", "umbilical cord"] },
  { id: "preterm", label: "Preterm labour", reference: "NICE NG25 · Preterm labour and birth", keys: ["preterm", "pprom", "prom", "tocolysis"] },
  { id: "ectopic", label: "Ectopic pregnancy", reference: "NICE NG126 · Ectopic pregnancy and miscarriage", keys: ["ectopic", "adnexal", "methotrexate"] },
  { id: "vte", label: "VTE risk", reference: "RCOG GTG 37a · VTE prevention", keys: ["vte", "dvt", "pulmonary embolism", "thrombosis"] },
  { id: "screening", label: "Screening visit", reference: "WHO · Antenatal care recommendations", keys: ["screening", "antenatal", "prenatal", "pap smear", "cervical"] },
];

const normalize = (value: string) => value.toLowerCase().replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));

const compactClinicalTerm = (value: string) => normalize(value).replace(/[^\p{L}\p{N}]/gu, "");

const isFourTsQuery = (query: string) => {
  const compact = compactClinicalTerm(query);
  return compact === "4t" || compact === "4ts" || compact === "fourts" || compact === "fourt";
};

const CLINICAL_QUERY_GROUPS = [
  ["PPH", "postpartum hemorrhage", "postpartum haemorrhage", "heavy bleeding after delivery", "uterine atony", "massive transfusion"],
  ["4 T's", "4T", "PPH causes", "Tone Tissue Trauma Thrombin", "uterine atony", "retained placenta", "genital tract trauma", "coagulopathy"],
  ["eclampsia", "preeclampsia", "pre-eclampsia", "hypertension in pregnancy", "magnesium sulfate", "MgSO4", "seizure"],
  ["shoulder dystocia", "McRoberts", "suprapubic pressure", "HELPERR", "difficult delivery"],
  ["cord prolapse", "umbilical cord prolapse", "funic presentation"],
  ["preterm labour", "preterm labor", "premature labor", "PPROM", "PROM", "tocolysis", "antenatal steroids"],
  ["ectopic pregnancy", "tubal pregnancy", "adnexal mass", "methotrexate"],
  ["VTE", "DVT", "pulmonary embolism", "PE", "thrombosis", "thromboembolism", "heparin", "LMWH"],
  ["C-section", "cesarean", "caesarean", "CS", "LSCS", "operative delivery"],
  ["antenatal", "prenatal", "ANC", "screening", "booking visit", "first visit"],
  ["miscarriage", "abortion", "pregnancy loss", "retained products", "RPOC"],
  ["sepsis", "maternal sepsis", "infection", "chorioamnionitis", "fever"],
];

const uniqueQueries = (queries: string[]) => Array.from(new Set(queries.map((item) => item.trim()).filter(Boolean)));

export function expandClinicalSearchQueries(query: string) {
  const q = query.trim();
  if (!q) return [];
  const compactQuery = compactClinicalTerm(q);
  const expansions = [q];

  for (const group of CLINICAL_QUERY_GROUPS) {
    const matchesGroup = group.some((term) => {
      const compactTerm = compactClinicalTerm(term);
      return compactTerm === compactQuery || compactTerm.includes(compactQuery) || compactQuery.includes(compactTerm);
    });

    if (matchesGroup) expansions.push(...group);
  }

  return uniqueQueries(expansions).slice(0, 14);
}

const scenarioBlob = (s: SearchScenario) =>
  normalize([s.title_en, s.situation_en, s.action_en, s.script_en, (s.synonyms || []).join(" ")].filter(Boolean).join(" "));

export function getSearchTokens(query: string) {
  const tokens = normalize(query)
    .split(/\s+/)
    .map((t) => t.replace(/[^\p{L}\p{N}+/-]/gu, ""))
    .filter((t) => t.length >= 3 && !STOP_WORDS.has(t));

  return tokens.length > 0
    ? tokens
    : normalize(query).split(/\s+/).map((t) => t.trim()).filter((t) => t.length >= 2);
}

function scoreScenario(s: SearchScenario, query: string, strict: boolean) {
  const q = normalize(query);
  const fourTs = isFourTsQuery(query);
  const tokens = getSearchTokens(query);
  const title = normalize(s.title_en || "");
  const sit = normalize(s.situation_en || "");
  const act = normalize(s.action_en || "");
  const script = normalize(s.script_en || "");
  const syn = normalize((s.synonyms || []).join(" "));
  const blob = `${title} ${sit} ${act} ${script} ${syn}`;
  let score = 0;
  let signalHits = 0;
  let matchedTokens = 0;

  if (fourTs) {
    if (blob.includes("4 t") || blob.includes("four t")) score += 60;
    if (blob.includes("pph") || blob.includes("postpartum hemorrhage") || blob.includes("postpartum haemorrhage")) score += 28;
    if (blob.includes("cause") || blob.includes("etiology") || blob.includes("atony")) score += 14;
  }

  for (const tok of tokens) {
    const inTitle = title.includes(tok);
    const inSyn = syn.includes(tok);
    const inSit = sit.includes(tok);
    const inAct = act.includes(tok);
    const inScript = script.includes(tok);
    if (inTitle) score += 16;
    if (inSyn) score += 10;
    if (inSit) score += 6;
    if (inAct) score += 2;
    if (inScript) score += 1;
    if (inTitle || inSyn || inSit) signalHits++;
    if (inTitle || inSyn || inSit || inAct || inScript) matchedTokens++;
  }

  if (fourTs && score > 0) return score;
  if (strict && (matchedTokens < tokens.length || signalHits === 0)) return 0;
  if (!strict && signalHits === 0 && matchedTokens === 0) return 0;
  if (tokens.length > 1 && title.includes(q)) score += 35;
  if (title.startsWith(q)) score += 25;
  if (title === q) score += 40;
  return score;
}

export function rankSearchScenarios(query: string, rows: SearchScenario[]) {
  const queryVariants = expandClinicalSearchQueries(query);
  const bestScore = (s: SearchScenario, strict: boolean) =>
    Math.max(...queryVariants.map((variant) => scoreScenario(s, variant, strict)));

  let ranked = rows
    .map((s) => ({ s, score: bestScore(s, true), urg: URGENCY_WEIGHT[detectUrgency(s)] }))
    .filter((x) => x.score >= 8)
    .sort((a, b) => (b.score - a.score) || (b.urg - a.urg))
    .map((x) => x.s);

  if (ranked.length === 0) {
    ranked = rows
      .map((s) => ({ s, score: bestScore(s, false), urg: URGENCY_WEIGHT[detectUrgency(s)] }))
      .filter((x) => x.score >= 6)
      .sort((a, b) => (b.score - a.score) || (b.urg - a.urg))
      .map((x) => x.s);
  }

  return ranked;
}

export function resolveTrustedClinicalVisual(s: SearchScenario): TrustedClinicalVisual | null {
  const text = scenarioBlob(s);
  const match = TRUSTED_VISUALS.find((visual) => visual.keys.some((key) => text.includes(key)));
  if (!match) return null;
  const { keys: _keys, ...trusted } = match;
  return trusted;
}