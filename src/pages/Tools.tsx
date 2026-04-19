import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Calculator, Siren, Pill, BookMarked, Brain, GraduationCap, WifiOff,
  Search, Check, X, ChevronRight, AlertTriangle, Shuffle, RotateCcw, Star, Trash2,
  Scissors,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  EDDCalculator, BishopCalculator, ApgarCalculator, MgSO4Calculator,
  BMICalculator, OvulationCalculator, GonadotropinCalculator,
} from "@/components/tools/Calculators";
import { BookmarkButton } from "@/components/tools/BookmarkButton";
import { SurgeryLibrary } from "@/components/tools/SurgeryLibrary";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useToolsData } from "@/hooks/useToolsData";
import { toast } from "@/hooks/use-toast";
import { DisclaimerBanner, InlineDisclaimer } from "@/components/Disclaimer";
import { PhIcon } from "@/components/ui/PhIcon";

const sections = [
  { id: "favorites", label: "Favorites", icon: Star, ph: "Star" as const, color: "from-amber-400 to-orange-500" },
  { id: "calc", label: "Calculators", icon: Calculator, ph: "Calculator" as const, color: "from-blue-500 to-indigo-600" },
  { id: "emergency", label: "Emergency", icon: Siren, ph: "Siren" as const, color: "from-red-500 to-rose-600" },
  { id: "drugs", label: "Drugs", icon: Pill, ph: "Pill" as const, color: "from-emerald-500 to-teal-600" },
  { id: "guidelines", label: "Guidelines", icon: BookMarked, ph: "BookmarkSimple" as const, color: "from-purple-500 to-pink-600" },
  { id: "ddx", label: "DDx", icon: Brain, ph: "Brain" as const, color: "from-amber-500 to-orange-600" },
  { id: "mcq", label: "MCQ", icon: GraduationCap, ph: "GraduationCap" as const, color: "from-cyan-500 to-blue-600" },
  { id: "surgeries", label: "Surgeries", icon: Scissors, ph: "Scissors" as const, color: "from-rose-500 to-pink-600" },
  { id: "offline", label: "Offline", icon: WifiOff, ph: "WifiSlash" as const, color: "from-slate-500 to-slate-700" },
] as const;

// Registry of calculator IDs → metadata, for the Favorites view
const CALC_REGISTRY: Record<string, { title: string; subtitle: string }> = {
  edd: { title: "EDD & Gestational Age", subtitle: "Naegele's rule" },
  bishop: { title: "Bishop Score", subtitle: "Cervical favorability" },
  apgar: { title: "APGAR Score", subtitle: "Newborn 1 & 5 min" },
  mgso4: { title: "MgSO₄ Protocol", subtitle: "Eclampsia / severe PET" },
  bmi: { title: "Pre-pregnancy BMI", subtitle: "IOM 2009 targets" },
  ovulation: { title: "Ovulation & Fertile Window", subtitle: "Calendar method" },
  gonadotropin: { title: "FSH Starting Dose", subtitle: "IVF stimulation" },
};


const STORAGE_TAB = "tools.activeTab";

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

function MCQCard({
  data, idx, onAnswer,
}: {
  data: typeof mcqs[0];
  idx: number;
  onAnswer: (correct: boolean) => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const reveal = picked !== null;
  const handlePick = (i: number) => {
    if (reveal) return;
    setPicked(i);
    onAnswer(i === data.correct);
  };
  return (
    <Card className="p-4 border-border/50">
      <div className="flex items-start gap-2 mb-3">
        <Badge variant="outline" className="text-[10px] shrink-0">Q{idx + 1}</Badge>
        <p className="text-sm font-medium leading-snug">{data.q}</p>
      </div>
      <div className="space-y-1.5" role="radiogroup" aria-label={`Question ${idx + 1}`}>
        {data.opts.map((o, i) => {
          const isCorrect = i === data.correct;
          const isPicked = i === picked;
          let cls = "border-border/50 bg-card hover:bg-muted/50";
          if (reveal && isCorrect) cls = "border-success/60 bg-success-soft text-success";
          else if (reveal && isPicked && !isCorrect) cls = "border-danger/60 bg-danger-soft text-danger";
          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={isPicked}
              disabled={reveal}
              onClick={() => handlePick(i)}
              className={`w-full text-left px-3 py-2 rounded-lg border text-xs font-medium transition flex items-center gap-2 ${cls}`}
            >
              <span className="font-bold opacity-60">{String.fromCharCode(65 + i)}.</span>
              <span className="flex-1">{o}</span>
              {reveal && isCorrect && <Check className="w-3.5 h-3.5 text-success shrink-0" />}
              {reveal && isPicked && !isCorrect && <X className="w-3.5 h-3.5 text-danger shrink-0" />}
            </button>
          );
        })}
      </div>
      {reveal && (
        <div className="mt-3 p-2.5 rounded-lg bg-muted/50 border border-border/40">
          <p className="text-[10px] uppercase tracking-wider font-bold text-primary mb-1">Explanation</p>
          <p className="text-[11px] leading-relaxed text-muted-foreground">{data.explain}</p>
        </div>
      )}
    </Card>
  );
}

const COMMON_DRUGS = [
  "warfarin", "heparin", "aspirin", "ibuprofen", "naproxen", "fluconazole", "itraconazole",
  "ssri", "sertraline", "fluoxetine", "tramadol", "methotrexate", "macrolide", "erythromycin",
  "clarithromycin", "statin", "simvastatin", "ocp", "rifampicin", "lamotrigine", "magnesium",
  "nifedipine", "metformin", "contrast", "nsaid", "azole", "labetalol",
];

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

  const result = useMemo(() => {
    if (!a.trim() || !b.trim()) return null;
    const A = norm(a);
    const B = norm(b);
    if (!A || !B) return null;

    const matchKey = Object.keys(interactions).find((k) => {
      const [x, y] = k.split("+");
      const ax = A.includes(x) || x.includes(A);
      const by = B.includes(y) || y.includes(B);
      const ay = A.includes(y) || y.includes(A);
      const bx = B.includes(x) || x.includes(B);
      return (ax && by) || (ay && bx);
    });
    return matchKey
      ? interactions[matchKey]
      : "No major interaction in our common-pairs database. Always cross-check with full reference (BNF/Lexicomp).";
  }, [a, b]);

  const severity: "danger" | "warning" | "success" = result?.startsWith("MAJOR")
    ? "danger"
    : result?.startsWith("MODERATE") || result?.startsWith("CAUTION")
    ? "warning"
    : "success";

  const sevClass = {
    danger: "bg-danger-soft border-danger/40 text-danger",
    warning: "bg-warning-soft border-warning/40 text-warning",
    success: "bg-success-soft border-success/40 text-success",
  }[severity];

  return (
    <Card className="p-4 border-border/50 space-y-3">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-gradient-to-br from-warning to-warning/70">
          <AlertTriangle className="w-3.5 h-3.5 text-warning-foreground" />
        </div>
        <h3 className="text-sm font-bold">Drug Interaction Checker</h3>
      </div>
      <datalist id="drug-list">
        {COMMON_DRUGS.map((d) => <option key={d} value={d} />)}
      </datalist>
      <div className="grid grid-cols-2 gap-2">
        <Input
          list="drug-list"
          placeholder="Drug A (e.g. warfarin)"
          value={a}
          onChange={(e) => setA(e.target.value)}
          className="h-9 text-xs"
          aria-label="First drug"
        />
        <Input
          list="drug-list"
          placeholder="Drug B (e.g. fluconazole)"
          value={b}
          onChange={(e) => setB(e.target.value)}
          className="h-9 text-xs"
          aria-label="Second drug"
        />
      </div>
      {result && (
        <div className={`p-3 rounded-xl border text-xs leading-relaxed font-medium ${sevClass}`} role="alert">
          {result}
        </div>
      )}
    </Card>
  );
}

const FDA_FILTERS = ["All", "A", "B", "C", "D", "X"] as const;

export default function Tools() {
  const [active, setActive] = useState<string>(() => {
    if (typeof window === "undefined") return "calc";
    const saved = window.localStorage.getItem(STORAGE_TAB);
    return saved && sections.some((s) => s.id === saved) ? saved : "calc";
  });
  const [drugSearch, setDrugSearch] = useState("");
  const [drugFilter, setDrugFilter] = useState<(typeof FDA_FILTERS)[number]>("All");
  const [offlineReady, setOfflineReady] = useState(false);
  const [mcqOrder, setMcqOrder] = useState<number[]>(() => mcqs.map((_, i) => i));
  const [mcqAnswers, setMcqAnswers] = useState<Record<number, boolean>>({});
  const { ids: bookmarkIds, isBookmarked, toggle: toggleBookmark, clear: clearBookmarks } = useBookmarks();
  const { protocols: emergencyProtocols, drugs: pregnancyDrugs, guidelines, ddx: ddxLibrary, source: toolsSource } = useToolsData();

  // Group bookmarks by type for the Favorites view
  const favorites = useMemo(() => {
    const calc: { id: string; title: string; subtitle: string }[] = [];
    const protocols: typeof emergencyProtocols = [];
    const drugs: typeof pregnancyDrugs = [];
    const ddx: typeof ddxLibrary = [];
    for (const raw of bookmarkIds) {
      const [kind, ...rest] = raw.split(":");
      const key = rest.join(":");
      if (kind === "calc" && CALC_REGISTRY[key]) {
        calc.push({ id: key, ...CALC_REGISTRY[key] });
      } else if (kind === "protocol") {
        const p = emergencyProtocols.find((x) => x.id === key);
        if (p) protocols.push(p);
      } else if (kind === "drug") {
        const d = pregnancyDrugs.find((x) => x.name === key);
        if (d) drugs.push(d);
      } else if (kind === "ddx") {
        const x = ddxLibrary.find((y) => y.presentation === key);
        if (x) ddx.push(x);
      }
    }
    return { calc, protocols, drugs, ddx, total: calc.length + protocols.length + drugs.length + ddx.length };
  }, [bookmarkIds]);

  const jumpToCalc = (id: string) => {
    setActive("calc");
    requestAnimationFrame(() => {
      setTimeout(() => {
        document.getElementById(`tool-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    });
  };


  useEffect(() => {
    window.localStorage.setItem(STORAGE_TAB, active);
  }, [active]);

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

  const filteredDrugs = useMemo(() => {
    const q = drugSearch.toLowerCase().trim();
    return pregnancyDrugs.filter((d) => {
      const matchSearch =
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.notes.toLowerCase().includes(q);
      const matchCat = drugFilter === "All" || d.category.includes(drugFilter);
      return matchSearch && matchCat;
    });
  }, [drugSearch, drugFilter]);

  const catColor = (c: string) =>
    c.includes("X") ? "bg-danger-soft text-danger border-danger/30" :
    c.includes("D") ? "bg-warning-soft text-warning border-warning/30" :
    c.includes("C") ? "bg-warning-soft text-warning border-warning/30" :
    c.includes("B") ? "bg-success-soft text-success border-success/30" :
    "bg-info-soft text-info border-info/30";

  const shuffleMcq = () => {
    const arr = [...mcqOrder];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setMcqOrder(arr);
    setMcqAnswers({});
  };

  const resetMcq = () => {
    setMcqAnswers({});
    setMcqOrder(mcqs.map((_, i) => i));
  };

  const mcqScore = Object.values(mcqAnswers).filter(Boolean).length;
  const mcqAnswered = Object.keys(mcqAnswers).length;

  return (
    <div className="min-h-screen gradient-paper text-foreground flex flex-col max-w-lg mx-auto relative tabular-nums">
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04] mix-blend-multiply"
        style={{ backgroundImage: "radial-gradient(hsl(0 0% 10%) 1px, transparent 1px)", backgroundSize: "3px 3px" }}
        aria-hidden="true"
      />
      <div className="h-[3px] gradient-gold relative z-20" />

      <header className="header-fade sticky top-0 z-20 px-4 sm:px-5 pt-4 pb-3 border-b border-border/50 bg-card/85 backdrop-blur-md">
        {/* Eyebrow line — matches Index masthead */}
        <div className="flex items-center justify-between mb-3 text-[9px] tracking-[0.22em] uppercase font-bold text-muted-foreground">
          <Link to="/" aria-label="Back to home" className="flex items-center gap-1.5 hover:text-foreground transition">
            <ArrowLeft className="w-3 h-3" />
            <span>Home</span>
          </Link>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-1 h-1 rounded-full bg-gold" />
            <span className="text-gold/90">Clinical Tools</span>
          </span>
        </div>

        {/* Masthead title */}
        <div className="mb-4">
          <h1 className="font-editorial italic font-black tracking-tight leading-[1.02] text-[26px] text-foreground">
            <span className="relative inline-block">
              <span className="bg-clip-text text-transparent bg-[linear-gradient(110deg,hsl(var(--foreground))_0%,hsl(var(--primary))_50%,hsl(var(--foreground))_100%)]">
                Clinical Tools
              </span>
              <span aria-hidden="true" className="absolute left-0 -bottom-1.5 h-[2px] w-full origin-left bg-gradient-to-r from-primary via-primary/50 to-transparent" />
            </span>
          </h1>
          <p className="mt-3 text-[11px] text-muted-foreground tracking-wide">
            Calculators · Protocols · Drugs · DDx · Surgery · MCQ
          </p>
        </div>

        <div className="divider-editorial mb-3" aria-hidden="true" />

        <nav
          aria-label="Tools sections"
          className="flex gap-1.5 overflow-x-auto scrollbar-none -mx-1 px-1 pb-0.5"
        >
          {sections.map((s) => {
            const isActive = active === s.id;
            const isFavBadge = s.id === "favorites" && favorites.total > 0 && !isActive;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActive(s.id)}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap border transition ${
                  isActive
                    ? `bg-gradient-to-r ${s.color} text-white border-transparent shadow-gold`
                    : "bg-card border-border/60 text-muted-foreground hover:bg-muted/50 hover:border-primary/30"
                }`}
              >
                <PhIcon
                  name={s.ph}
                  size={14}
                  weight={isActive || isFavBadge ? "fill" : "duotone"}
                  tone={isActive ? "white" : isFavBadge ? "gold" : "current"}
                />
                {s.label}
                {s.id === "favorites" && favorites.total > 0 && (
                  <span className={`text-[9px] tabular-nums px-1.5 rounded-full ${isActive ? "bg-white/25" : "bg-warning/20 text-warning"}`}>
                    {favorites.total}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="flex-1 px-4 sm:px-5 pt-5 pb-6">
        <Tabs value={active} onValueChange={setActive} className="w-full">
          <TabsList className="hidden">
            {sections.map((s) => <TabsTrigger key={s.id} value={s.id}>{s.label}</TabsTrigger>)}
          </TabsList>

          {/* FAVORITES */}
          <TabsContent value="favorites" className="space-y-3 mt-0">
            {favorites.total === 0 ? (
              <Card className="p-8 border-border/50 text-center">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-3">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-base font-bold mb-1">No favorites yet</h3>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-[260px] mx-auto">
                  Tap the <Star className="w-3 h-3 inline mx-0.5 text-warning fill-warning" /> on any calculator,
                  protocol, drug or DDx to pin it here for instant access.
                </p>
              </Card>
            ) : (
              <>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] text-muted-foreground tabular-nums">
                    <span className="font-bold text-foreground">{favorites.total}</span> saved item{favorites.total === 1 ? "" : "s"}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (window.confirm("Remove all bookmarks?")) {
                        clearBookmarks();
                        toast({ title: "Cleared", description: "All favorites removed." });
                      }
                    }}
                    className="h-7 text-[10px] gap-1 text-muted-foreground"
                  >
                    <Trash2 className="w-3 h-3" /> Clear all
                  </Button>
                </div>

                {favorites.calc.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70 px-1">
                      Calculators
                    </p>
                    {favorites.calc.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => jumpToCalc(c.id)}
                        className="w-full flex items-center gap-2.5 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/40 hover:bg-muted/40 transition text-left"
                      >
                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary to-primary/70">
                          <Calculator className="w-3.5 h-3.5 text-primary-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-bold text-foreground leading-tight">{c.title}</p>
                          <p className="text-[10px] text-muted-foreground leading-tight">{c.subtitle}</p>
                        </div>
                        <BookmarkButton id={`calc:${c.id}`} label={c.title} />
                      </button>
                    ))}
                  </div>
                )}

                {favorites.protocols.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70 px-1">
                      Emergency protocols
                    </p>
                    {favorites.protocols.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setActive("emergency")}
                        className="w-full flex items-center gap-2.5 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/40 hover:bg-muted/40 transition text-left"
                      >
                        <div className={`p-1.5 rounded-lg bg-gradient-to-br ${p.color}`}>
                          <Siren className="w-3.5 h-3.5 text-white" />
                        </div>
                        <p className="text-[12px] font-bold text-foreground flex-1 leading-tight">{p.title}</p>
                        <BookmarkButton id={`protocol:${p.id}`} label={p.title} />
                      </button>
                    ))}
                  </div>
                )}

                {favorites.drugs.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70 px-1">
                      Drugs
                    </p>
                    {favorites.drugs.map((d) => (
                      <button
                        key={d.name}
                        type="button"
                        onClick={() => setActive("drugs")}
                        className="w-full flex items-center gap-2.5 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/40 hover:bg-muted/40 transition text-left"
                      >
                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                          <Pill className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-bold text-foreground leading-tight">{d.name}</p>
                          <p className="text-[10px] text-muted-foreground leading-tight truncate">FDA {d.category} • {d.trimester}</p>
                        </div>
                        <BookmarkButton id={`drug:${d.name}`} label={d.name} />
                      </button>
                    ))}
                  </div>
                )}

                {favorites.ddx.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70 px-1">
                      Differential diagnoses
                    </p>
                    {favorites.ddx.map((x) => (
                      <button
                        key={x.presentation}
                        type="button"
                        onClick={() => setActive("ddx")}
                        className="w-full flex items-center gap-2.5 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/40 hover:bg-muted/40 transition text-left"
                      >
                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
                          <Brain className="w-3.5 h-3.5 text-white" />
                        </div>
                        <p className="text-[12px] font-bold text-foreground flex-1 leading-tight">{x.presentation}</p>
                        <BookmarkButton id={`ddx:${x.presentation}`} label={x.presentation} />
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>

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
                <AccordionItem
                  key={p.id}
                  value={p.id}
                  id={`protocol-${p.id}`}
                  className="border-0 bg-card rounded-2xl overflow-hidden border border-border/50 scroll-mt-32"
                >
                  <div className="flex items-center gap-2 pr-3">
                    <AccordionTrigger className="flex-1 px-4 py-3 hover:no-underline">
                      <div className="flex items-center gap-2.5 text-left">
                        <div className={`p-1.5 rounded-lg bg-gradient-to-br ${p.color} shrink-0`}>
                          <Siren className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="text-sm font-bold">{p.title}</span>
                      </div>
                    </AccordionTrigger>
                    <BookmarkButton id={`protocol:${p.id}`} label={p.title} />
                  </div>
                  <AccordionContent className="px-4 pb-4">
                    <ol className="space-y-1.5">
                      {p.steps.map((s, i) => (
                        <li key={i} className="flex gap-2 text-[12px] leading-relaxed">
                          <span className="font-black text-primary shrink-0 tabular-nums w-5">{i + 1}.</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ol>
                    <div className="mt-3 p-2.5 rounded-lg bg-success-soft border border-success/30">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-success mb-0.5">Targets</p>
                      <p className="text-[11px] text-success">{p.targets}</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </TabsContent>

          {/* DRUGS */}
          <TabsContent value="drugs" className="space-y-3 mt-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <Input
                value={drugSearch}
                onChange={(e) => setDrugSearch(e.target.value)}
                placeholder="Search drugs in pregnancy / lactation..."
                className="h-10 pl-9 pr-9 text-xs"
                aria-label="Search drugs"
              />
              {drugSearch && (
                <button
                  type="button"
                  onClick={() => setDrugSearch("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              )}
            </div>

            <div className="flex gap-1 flex-wrap" role="tablist" aria-label="FDA category filter">
              {FDA_FILTERS.map((f) => {
                const isActive = drugFilter === f;
                return (
                  <button
                    key={f}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setDrugFilter(f)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition ${
                      isActive
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border/50 text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    {f === "All" ? "All" : `FDA ${f}`}
                  </button>
                );
              })}
            </div>

            <p className="text-[10px] text-muted-foreground tabular-nums">
              {filteredDrugs.length} of {pregnancyDrugs.length} drugs
            </p>

            <div className="space-y-1.5">
              {filteredDrugs.map((d) => (
                <Card key={d.name} id={`drug-${d.name}`} className="p-3 border-border/50 scroll-mt-32">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="text-sm font-bold flex-1">{d.name}</h4>
                    <Badge className={`${catColor(d.category)} text-[10px] shrink-0 border`}>
                      FDA {d.category}
                    </Badge>
                    <BookmarkButton id={`drug:${d.name}`} label={d.name} />
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[10px] mb-1.5">
                    <div><span className="text-muted-foreground">Trimester:</span> <span className="font-semibold">{d.trimester}</span></div>
                    <div><span className="text-muted-foreground">Lactation:</span> <span className="font-semibold">{d.lactation}</span></div>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug">{d.notes}</p>
                  <InlineDisclaimer className="mt-1.5" />
                </Card>
              ))}
              {filteredDrugs.length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-6">No drug matches your filter.</p>
              )}
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
                <AccordionItem
                  key={d.presentation}
                  value={d.presentation}
                  id={`ddx-${d.presentation}`}
                  className="border-0 bg-card rounded-2xl overflow-hidden border border-border/50 scroll-mt-32"
                >
                  <div className="flex items-center gap-2 pr-3">
                    <AccordionTrigger className="flex-1 px-4 py-3 hover:no-underline">
                      <div className="flex items-center gap-2.5 text-left">
                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shrink-0">
                          <Brain className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="text-sm font-bold">{d.presentation}</span>
                      </div>
                    </AccordionTrigger>
                    <BookmarkButton id={`ddx:${d.presentation}`} label={d.presentation} />
                  </div>
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
                    <div className="p-2.5 rounded-lg bg-danger-soft border border-danger/30">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-danger mb-0.5">Red Flags</p>
                      <p className="text-[11px] text-danger">{d.redFlags}</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <DrugInteractionChecker />
          </TabsContent>

          {/* MCQ */}
          <TabsContent value="mcq" className="space-y-3 mt-0">
            <Card className="p-3 border-border/50 flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Score</p>
                <p className="text-base font-black tabular-nums">
                  {mcqScore} / {mcqAnswered}
                  <span className="text-[10px] font-medium text-muted-foreground ml-1">
                    of {mcqs.length}
                  </span>
                </p>
              </div>
              <div className="flex gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={shuffleMcq}
                  className="h-8 text-[10px] gap-1"
                >
                  <Shuffle className="w-3 h-3" /> Shuffle
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetMcq}
                  className="h-8 text-[10px] gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </Button>
              </div>
            </Card>
            {mcqOrder.map((origIdx, displayIdx) => (
              <MCQCard
                key={`${origIdx}-${mcqOrder.join(",")}`}
                data={mcqs[origIdx]}
                idx={displayIdx}
                onAnswer={(c) => setMcqAnswers((p) => ({ ...p, [origIdx]: c }))}
              />
            ))}
          </TabsContent>

          {/* SURGERIES */}
          <TabsContent value="surgeries" className="space-y-3 mt-0">
            <SurgeryLibrary />
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
                <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-success-soft border border-success/30">
                  <Check className="w-4 h-4 text-success" />
                  <span className="text-xs font-bold text-success">Offline mode active</span>
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

      {/* Disclaimer — placed just above the footer for legal prominence */}
      <div className="px-4 sm:px-5 pt-2 pb-5">
        <DisclaimerBanner />
      </div>

      <footer className="relative px-5 pt-6 pb-9 border-t border-border/50 bg-gradient-to-b from-card/40 to-card/70 overflow-hidden">
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full bg-gradient-to-br from-gold/10 to-transparent blur-3xl pointer-events-none" aria-hidden="true" />
        <div className="divider-editorial mb-3 relative" aria-hidden="true" />
        <div className="flex items-center justify-center gap-2 mb-2 relative">
          <span className="h-px w-6 bg-gradient-to-r from-transparent to-gold/40" aria-hidden="true" />
          <span className="text-[9px] text-gold/80 font-semibold tracking-[0.2em] uppercase">Clinical Tools</span>
          <span className="h-px w-6 bg-gradient-to-l from-transparent to-gold/40" aria-hidden="true" />
        </div>
        <p className="text-center text-[10px] text-muted-foreground tabular-nums relative">
          © {new Intl.NumberFormat("en-US-u-nu-latn").format(2026)} <span className="font-semibold text-foreground/80">Tips &amp; Tricks</span> · Crafted for OB/GYN excellence
        </p>
      </footer>
    </div>
  );
}
