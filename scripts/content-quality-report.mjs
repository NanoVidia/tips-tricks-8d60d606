import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const outPath = resolve(root, "reports/content-quality-report.json");

const read = (path) => readFileSync(resolve(root, path), "utf8");
const count = (text, pattern) => [...text.matchAll(pattern)].length;

const mcqBank = read("src/data/mcqBank.ts");
const mcqExtra = read("src/data/mcqBankExtra.ts");
const mcqExpansion = read("src/data/mcqBankExpansion.ts");
const mcqExpansionPhase2 = read("src/data/mcqBankExpansionPhase2.ts");
const mcqExpansionPhase3 = read("src/data/mcqBankExpansionPhase3.ts");
const mcqExpansionPhase4 = read("src/data/mcqBankExpansionPhase4.ts");
const mcqExpansionPhase5 = read("src/data/mcqBankExpansionPhase5.ts");
const mcqExpansionPhase6 = read("src/data/mcqBankExpansionPhase6.ts");
const surgeries = read("src/data/surgeriesData.ts");
const tools = read("src/data/toolsData.ts");
const clinical = read("src/data/clinicalData.ts");

const qCalls = [...`${mcqExtra}\n${mcqExpansion}\n${mcqExpansionPhase2}\n${mcqExpansionPhase3}\n${mcqExpansionPhase4}\n${mcqExpansionPhase5}\n${mcqExpansionPhase6}`.matchAll(/Q\("([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*"([\s\S]*?)",\s*\[([\s\S]*?)\],\s*(\d),\s*"([\s\S]*?)",\s*"([\s\S]*?)"/g)];
const objectMcqs = count(mcqBank, /id:\s*"[^"]+"/g);
const totalMcqs = objectMcqs + qCalls.length;
const topicCounts = qCalls.reduce((acc, m) => {
  acc[m[2]] = (acc[m[2]] ?? 0) + 1;
  return acc;
}, {});
const difficultyCounts = qCalls.reduce((acc, m) => {
  acc[m[3]] = (acc[m[3]] ?? 0) + 1;
  return acc;
}, {});
const shortExplanations = qCalls
  .map((m) => ({ id: m[1], topic: m[2], explanationLength: m[7].length }))
  .filter((q) => q.explanationLength < 80);
const weakReferences = qCalls
  .map((m) => ({ id: m[1], topic: m[2], reference: m[8] }))
  .filter((q) => q.reference.length < 8 || /unknown|tbd|reference needed|wikipedia/i.test(q.reference));
const qualityReadyMcqs = Math.max(0, totalMcqs - shortExplanations.length - weakReferences.length);

const videoTitles = [...surgeries.matchAll(/videoTitle:\s*"([^"]*)"/g)].map((m) => m[1]);
const weakVideoTerms = /(patient|guide|instructions|explained|animation|shorts|pregnant after|minute|nclex|nursing|deviated septum|appendix)/i;
const weakVideos = videoTitles.filter((title) => weakVideoTerms.test(title));

const report = {
  generatedAt: new Date().toISOString(),
  summary: {
    staticMcqs: totalMcqs,
    targetMcqs: 1000,
    mcqGap: Math.max(0, 1000 - totalMcqs),
    qualityReadyMcqs,
    qualityAdjustedGap: Math.max(0, 1000 - qualityReadyMcqs),
    surgeries: count(surgeries, /id:\s*"[^"]+"/g),
    emergencyProtocols: count(tools, /id:\s*"[^"]+"/g),
    clinicalSeedCards: count(clinical, /id:\s*"[^"]+"/g),
  },
  urgentFindings: [
    totalMcqs < 1000 ? `MCQ bank is ${totalMcqs}; gap to 1000 is ${1000 - totalMcqs}.` : "MCQ target reached.",
    shortExplanations.length ? `${shortExplanations.length} static Q() explanations are under 80 characters.` : "No very short static Q() explanations detected.",
    weakReferences.length ? `${weakReferences.length} static Q() references need strengthening.` : "No weak static Q() references detected.",
    weakVideos.length ? `${weakVideos.length} video titles contain weak relevance signals.` : "No weak video-title signals detected.",
  ],
  distribution: {
    expansionTopics: topicCounts,
    expansionDifficulties: difficultyCounts,
  },
  samples: {
    shortExplanations: shortExplanations.slice(0, 25),
    weakReferences: weakReferences.slice(0, 25),
    weakVideos: weakVideos.slice(0, 40),
  },
  nextPriorities: [
    "Keep Tools MCQ connected to the unified MCQ bank, not a separate fixed mini-bank.",
    "Expand MCQs topic-by-topic to 300, then 500, then 1000 with references.",
    "Replace or hide weak surgical videos instead of embedding low-confidence videos.",
    "Enrich short Q&A cards with direct answer, reasoning, red flags, related branches, and reference.",
  ],
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Content quality report written to ${outPath}`);
console.log(JSON.stringify(report.summary, null, 2));