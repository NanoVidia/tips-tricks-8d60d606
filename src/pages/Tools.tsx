import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calculator, Siren, Pill, BookMarked, Brain, GraduationCap, WifiOff, Search, Check, X, ChevronRight, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  EDDCalculator, BishopCalculator, ApgarCalculator, MgSO4Calculator, BMICalculator, OvulationCalculator, GonadotropinCalculator,
} from "@/components/tools/Calculators";
import { emergencyProtocols, pregnancyDrugs, guidelines, ddxLibrary } from "@/data/toolsData";
import { toast } from "@/hooks/use-toast";

const sections = [
  { id: "calc", label: "Calculators", icon: Calculator, color: "from-blue-500 to-indigo-600" },
  { id: "emergency", label: "Emergency", icon: Siren, color: "from-red-500 to-rose-600" },
  { id: "drugs", label: "Drugs", icon: Pill, color: "from-emerald-500 to-teal-600" },
  { id: "guidelines", label: "Guidelines", icon: BookMarked, color: "from-purple-500 to-pink-600" },
  { id: "ddx", label: "DDx", icon: Brain, color: "from-amber-500 to-orange-600" },
  { id: "mcq", label: "MCQ", icon: GraduationCap, color: "from-cyan-500 to-blue-600" },
  { id: "offline", label: "Offline", icon: WifiOff, color: "from-slate-500 to-slate-700" },
] as const;

const mcqs = [
  {
    q: "A 32-year-old G2P1 at 34 weeks presents with BP 165/110, proteinuria 3+, and a generalized seizure. After ABC stabilization, what is the FIRST-line treatment to prevent further seizures?",
    opts: ["Diazepam 10 mg IV", "Magnesium sulfate 4 g IV loading", "Phenytoin 1 g IV", "Labetalol 20 mg IV"],
    correct: 1,
    explain: "MgSO4 is the gold-standard anticonvulsant for eclampsia (Magpie trial). 4 g IV over 5–10 min loading + 1 g/h maintenance. Labetalol controls BP but not seizures.",
  },
  {
    q: "Which intervention has the STRONGEST evidence for reducing preeclampsia in high-risk women?",
    opts: ["Calcium 1.5 g/day", "Vitamin D 1000 IU/day", "Low-dose aspirin 75–150 mg from 12 weeks", "Bed rest"],
    correct: 2,
    explain: "ASPRE trial: aspirin 150 mg from 11–14 wk reduces preterm PET by ~62%. Calcium helps in low-intake populations. Bed rest is not recommended.",
  },
  {
    q: "A primigravida is fully dilated for 3 hours with epidural and adequate contractions, but the head remains at +1 station with persistent OP position. Best next step?",
    opts: ["Immediate CS", "Continue pushing another hour", "Trial of rotational instrumental delivery in theatre", "Augment with oxytocin"],
    correct: 2,
    explain: "Failure to progress in 2nd stage with OP position warrants trial in theatre — capable of immediate CS if delivery not achieved within 3 attempts/20 min.",
  },
  {
    q: "Most appropriate first investigation for postmenopausal bleeding?",
    opts: ["Endometrial biopsy", "Hysteroscopy", "Transvaginal ultrasound (endometrial thickness)", "MRI pelvis"],
    correct: 2,
    explain: "TVUS is first-line. Endometrial thickness ≤4 mm has high NPV (~99%) for malignancy. >4 mm → pipelle biopsy ± hysteroscopy.",
  },
  {
    q: "Which is the most common cause of secondary amenorrhea (excluding pregnancy)?",
    opts: ["Premature ovarian insufficiency", "Polycystic ovary syndrome", "Hyperprolactinemia", "Asherman's syndrome"],
    correct: 1,
    explain: "PCOS accounts for ~30% of secondary amenorrhea. Always exclude pregnancy first with βhCG.",
  },
  {
    q: "A woman with previous classical CS presents at 36 weeks with severe abdominal pain and fetal bradycardia. Most likely diagnosis?",
    opts: ["Placental abruption", "Uterine rupture", "Severe preeclampsia", "Acute appendicitis"],
    correct: 1,
    explain: "Classical CS scar has ~4–9% rupture risk (vs <1% for low transverse). Severe pain + fetal bradycardia in a scarred uterus = rupture until proven otherwise.",
  },
  {
    q: "Best contraceptive choice for a 35-year-old smoker with migraine with aura?",
    opts: ["Combined oral contraceptive", "Progesterone-only pill", "Copper IUD", "Combined patch"],
    correct: 2,
    explain: "Migraine with aura is UKMEC 4 (absolute contraindication) for combined hormonal contraception due to stroke risk. Copper IUD or POP/LNG-IUS are safe.",
  },
  {
    q: "First-line drug for medical management of ectopic pregnancy?",
    opts: ["Mifepristone", "Methotrexate IM single-dose", "Misoprostol PV", "Letrozole"],
    correct: 1,
    explain: "Single-dose MTX 50 mg/m² IM if hCG <5000, no fetal cardiac activity, mass <3.5 cm, hemodynamically stable, and reliable follow-up.",
  },
];

function MCQCard({ data, idx }: { data: typeof mcqs[0]; idx: number }) {
  const [picked, setPicked] = useState<number | null>(null);
  const reveal = picked !== null;
  return (
    <Card className="p-4 border-border/50">
      <div className="flex items-start gap-2 mb-3">
        <Badge variant="outline" className="text-[10px] shrink-0">Q{idx + 1}</Badge>
        <p className="text-sm font-medium leading-snug">{data.q}</p>
      </div>
      <div className="space-y-1.5">
        {data.opts.map((o, i) => {
          const isCorrect = i === data.correct;
          const isPicked = i === picked;
          let cls = "border-border/50 bg-card hover:bg-muted/50";
          if (reveal && isCorrect) cls = "border-emerald-500/60 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200";
          else if (reveal && isPicked && !isCorrect) cls = "border-red-500/60 bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-200";
          return (
            <button
              key={i}
              disabled={reveal}
              onClick={() => setPicked(i)}
              className={`w-full text-left px-3 py-2 rounded-lg border text-xs font-medium transition flex items-center gap-2 ${cls}`}
            >
              <span className="font-bold opacity-60">{String.fromCharCode(65 + i)}.</span>
              <span className="flex-1">{o}</span>
              {reveal && isCorrect && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
              {reveal && isPicked && !isCorrect && <X className="w-3.5 h-3.5 text-red-600 shrink-0" />}
            </button>
          );
        })}
      </div>
      {reveal && (
        <div className="mt-3 p-2.5 rounded-lg bg-muted/50 border border-border/40">
          <p className="text-[10px] uppercase tracking-wider font-bold text-primary mb-1">Explanation</p>
          <p className="text-[11px] leading-relaxed text-muted-foreground">{data.explain}</p>
          <button onClick={() => setPicked(null)} className="text-[10px] font-bold text-primary mt-2 hover:underline">Try again</button>
        </div>
      )}
    </Card>
  );
}

function DrugInteractionChecker() {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const interactions: Record<string, string> = {
    "warfarin+nsaid": "MAJOR — increased bleeding risk via platelet inhibition + GI mucosal damage. Avoid combo.",
    "warfarin+azole": "MAJOR — fluconazole/itraconazole inhibit CYP2C9 → ↑INR. Reduce warfarin dose 50%.",
    "ssri+tramadol": "MAJOR — serotonin syndrome risk. Avoid; use alternative analgesic.",
    "methotrexate+nsaid": "MAJOR — ↑MTX toxicity (renal/hematologic). Hold NSAID.",
    "macrolide+statin": "MODERATE — ↑rhabdomyolysis risk via CYP3A4 inhibition.",
    "ocp+rifampicin": "MAJOR — enzyme induction → contraceptive failure. Use alternative for 28 days post.",
    "ocp+lamotrigine": "MODERATE — OCP ↓lamotrigine levels by ~50%; seizure risk.",
    "magnesium+nifedipine": "CAUTION — additive hypotension and neuromuscular blockade. Monitor closely.",
    "metformin+contrast": "CAUTION — hold 48 h around iodinated contrast; lactic acidosis risk if AKI.",
    "ssri+nsaid": "MODERATE — ↑GI bleeding risk. Consider PPI cover.",
  };
  const norm = (s: string) => s.toLowerCase().trim().replace(/s$/, "");
  const A = norm(a), B = norm(b);
  const key = [A, B].sort().join("+");
  const matchKey = Object.keys(interactions).find((k) => {
    const [x, y] = k.split("+");
    return (A.includes(x) || x.includes(A)) && (B.includes(y) || y.includes(B)) ||
           (A.includes(y) || y.includes(A)) && (B.includes(x) || x.includes(B));
  });
  const result = matchKey ? interactions[matchKey] : a && b ? "No major interaction in our common-pairs database. Always cross-check with full reference (BNF/Lexicomp)." : null;
  const severity = result?.startsWith("MAJOR") ? "red" : result?.startsWith("MODERATE") ? "amber" : result?.startsWith("CAUTION") ? "amber" : "emerald";

  return (
    <Card className="p-4 border-border/50 space-y-3">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
          <AlertTriangle className="w-3.5 h-3.5 text-white" />
        </div>
        <h3 className="text-sm font-bold">Drug Interaction Checker</h3>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input placeholder="Drug A (e.g. warfarin)" value={a} onChange={(e) => setA(e.target.value)} className="h-9 text-xs" />
        <Input placeholder="Drug B (e.g. fluconazole)" value={b} onChange={(e) => setB(e.target.value)} className="h-9 text-xs" />
      </div>
      {result && (
        <div className={`p-3 rounded-xl border text-xs leading-relaxed ${
          severity === "red" ? "bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200" :
          severity === "amber" ? "bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200" :
          "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
        }`}>
          {result}
        </div>
      )}
    </Card>
  );
}

export default function Tools() {
  const [active, setActive] = useState<string>("calc");
  const [drugSearch, setDrugSearch] = useState("");
  const [offlineReady, setOfflineReady] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then((r) => setOfflineReady(!!r));
    }
  }, []);

  const enableOffline = async () => {
    if (!("serviceWorker" in navigator)) {
      toast({ title: "Not supported", description: "Your browser does not support offline mode." });
      return;
    }
    try {
      await navigator.serviceWorker.register("/sw.js");
      setOfflineReady(true);
      toast({ title: "Offline mode enabled", description: "App will work without internet on next visit." });
    } catch (e) {
      toast({ title: "Failed", description: "Could not enable offline mode." });
    }
  };

  const filteredDrugs = pregnancyDrugs.filter((d) => d.name.toLowerCase().includes(drugSearch.toLowerCase()) || d.notes.toLowerCase().includes(drugSearch.toLowerCase()));

  const catColor = (c: string) =>
    c.includes("X") ? "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30" :
    c.includes("D") ? "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30" :
    c.includes("C") ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30" :
    c.includes("B") ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" :
    "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30";

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto">
      <div className="h-1 bg-gradient-to-r from-rose-500 via-blue-500 to-emerald-500" />

      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border/40 px-4 py-3">
        <div className="flex items-center gap-2 mb-3">
          <Link to="/" className="p-1.5 -ml-1.5 rounded-lg hover:bg-muted transition">
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-black text-foreground tracking-tight">Clinical Tools</h1>
            <p className="text-[10px] text-muted-foreground">Calculators • Protocols • References</p>
          </div>
        </div>

        <div className="flex gap-1.5 overflow-x-auto scrollbar-none -mx-1 px-1 pb-1">
          {sections.map((s) => {
            const Icon = s.icon;
            const isActive = active === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap border transition ${
                  isActive
                    ? `bg-gradient-to-r ${s.color} text-white border-transparent shadow-sm`
                    : "bg-card border-border/50 text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <Icon className="w-3 h-3" />
                {s.label}
              </button>
            );
          })}
        </div>
      </header>

      <main className="flex-1 px-4 py-4">
        <Tabs value={active} onValueChange={setActive} className="w-full">
          <TabsList className="hidden">
            {sections.map((s) => <TabsTrigger key={s.id} value={s.id}>{s.label}</TabsTrigger>)}
          </TabsList>

          {/* CALCULATORS */}
          <TabsContent value="calc" className="space-y-3 mt-0">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <EDDCalculator />
              <BishopCalculator />
              <ApgarCalculator />
              <MgSO4Calculator />
              <BMICalculator />
              <OvulationCalculator />
              <GonadotropinCalculator />
            </motion.div>
          </TabsContent>

          {/* EMERGENCY */}
          <TabsContent value="emergency" className="space-y-3 mt-0">
            <Accordion type="single" collapsible className="space-y-2">
              {emergencyProtocols.map((p) => (
                <AccordionItem key={p.id} value={p.id} className="border-0 bg-card rounded-2xl overflow-hidden border border-border/50">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-2.5 text-left">
                      <div className={`p-1.5 rounded-lg bg-gradient-to-br ${p.color} shrink-0`}>
                        <Siren className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-sm font-bold">{p.title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <ol className="space-y-1.5">
                      {p.steps.map((s, i) => (
                        <li key={i} className="flex gap-2 text-[12px] leading-relaxed">
                          <span className="font-black text-primary shrink-0 tabular-nums">{i + 1}.</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ol>
                    <div className="mt-3 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-700 dark:text-emerald-400 mb-0.5">Targets</p>
                      <p className="text-[11px] text-emerald-900 dark:text-emerald-200">{p.targets}</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </TabsContent>

          {/* DRUGS */}
          <TabsContent value="drugs" className="space-y-3 mt-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={drugSearch}
                onChange={(e) => setDrugSearch(e.target.value)}
                placeholder="Search drugs in pregnancy / lactation..."
                className="h-10 pl-9 text-xs"
              />
            </div>
            <div className="flex gap-1 text-[9px] flex-wrap">
              <Badge className={catColor("A")}>A: Safe</Badge>
              <Badge className={catColor("B")}>B: Likely safe</Badge>
              <Badge className={catColor("C")}>C: Caution</Badge>
              <Badge className={catColor("D")}>D: Risk</Badge>
              <Badge className={catColor("X")}>X: Contraindicated</Badge>
            </div>
            <div className="space-y-1.5">
              {filteredDrugs.map((d) => (
                <Card key={d.name} className="p-3 border-border/50">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="text-sm font-bold">{d.name}</h4>
                    <Badge className={`${catColor(d.category)} text-[10px] shrink-0 border`}>FDA {d.category}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[10px] mb-1.5">
                    <div><span className="text-muted-foreground">Trimester:</span> <span className="font-semibold">{d.trimester}</span></div>
                    <div><span className="text-muted-foreground">Lactation:</span> <span className="font-semibold">{d.lactation}</span></div>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug">{d.notes}</p>
                </Card>
              ))}
              {filteredDrugs.length === 0 && <p className="text-center text-xs text-muted-foreground py-6">No drug found.</p>}
            </div>
          </TabsContent>

          {/* GUIDELINES */}
          <TabsContent value="guidelines" className="space-y-3 mt-0">
            {guidelines.map((g) => (
              <Card key={g.society} className="p-4 border-border/50">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/40">
                  <div className={`p-1.5 rounded-lg bg-gradient-to-br ${g.color}`}>
                    <BookMarked className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">{g.society}</h3>
                    <p className="text-[10px] text-muted-foreground">{g.region}</p>
                  </div>
                </div>
                <ul className="space-y-1.5">
                  {g.items.map((item, i) => (
                    <li key={i} className="flex gap-2 text-[12px] leading-relaxed">
                      <ChevronRight className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </TabsContent>

          {/* DDx */}
          <TabsContent value="ddx" className="space-y-3 mt-0">
            <Accordion type="single" collapsible className="space-y-2">
              {ddxLibrary.map((d) => (
                <AccordionItem key={d.presentation} value={d.presentation} className="border-0 bg-card rounded-2xl overflow-hidden border border-border/50">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-2.5 text-left">
                      <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shrink-0">
                        <Brain className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-sm font-bold">{d.presentation}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-primary mb-1.5">Differentials</p>
                    <ul className="space-y-1 mb-3">
                      {d.differentials.map((x, i) => (
                        <li key={i} className="flex gap-2 text-[12px] leading-relaxed">
                          <span className="text-primary">•</span>
                          <span>{x}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-red-700 dark:text-red-400 mb-0.5">Red Flags</p>
                      <p className="text-[11px] text-red-900 dark:text-red-200">{d.redFlags}</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <DrugInteractionChecker />
          </TabsContent>

          {/* MCQ */}
          <TabsContent value="mcq" className="space-y-3 mt-0">
            <p className="text-[11px] text-muted-foreground text-center mb-2">
              {mcqs.length} board-style questions • OB/GYN core
            </p>
            {mcqs.map((m, i) => <MCQCard key={i} data={m} idx={i} />)}
          </TabsContent>

          {/* OFFLINE */}
          <TabsContent value="offline" className="space-y-3 mt-0">
            <Card className="p-5 border-border/50 text-center">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center mb-3">
                <WifiOff className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-base font-bold mb-1">Offline Mode</h3>
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                Cache the app on your device so you can access calculators, protocols, drugs and guidelines inside the OR or remote clinics — no internet needed.
              </p>
              {offlineReady ? (
                <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Offline mode active</span>
                </div>
              ) : (
                <Button onClick={enableOffline} className="w-full">
                  Enable offline access
                </Button>
              )}
              <p className="text-[10px] text-muted-foreground mt-3 leading-tight">
                Note: AI chat features require internet. Reference content only available offline.
              </p>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
