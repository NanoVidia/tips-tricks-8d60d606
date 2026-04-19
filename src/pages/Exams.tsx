import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ExternalLink, GitCompare, Trophy, Clock, FileText, BookOpen, TrendingUp } from "lucide-react";
import { EXAMS, type ExamMeta } from "@/data/examsData";
import { ExamSimulator } from "@/components/exams/ExamSimulator";
import { DisclaimerBanner } from "@/components/Disclaimer";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";

interface ProgressEntry {
  date: string;
  total: number;
  score: number;
  durationSec: number;
}
type ProgressMap = Record<string, ProgressEntry[]>;

const LINE_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--info))",
  "hsl(var(--danger))",
];

function loadProgress(): ProgressMap {
  const out: ProgressMap = {};
  if (typeof window === "undefined") return out;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith("exam_progress_")) continue;
    const examId = key.replace("exam_progress_", "");
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "[]") as ProgressEntry[];
      if (Array.isArray(parsed) && parsed.length > 0) out[examId] = parsed;
    } catch {
      /* ignore */
    }
  }
  return out;
}

function ProgressChart() {
  const [progress, setProgress] = useState<ProgressMap>({});
  const [activeExams, setActiveExams] = useState<Set<string>>(new Set());

  useEffect(() => {
    const data = loadProgress();
    setProgress(data);
    setActiveExams(new Set(Object.keys(data)));
  }, []);

  const examIds = Object.keys(progress);

  const chartData = useMemo(() => {
    const rows: Array<Record<string, string | number>> = [];
    examIds.forEach((examId) => {
      progress[examId].forEach((e) => {
        const pct = e.total > 0 ? Math.round((e.score / e.total) * 100) : 0;
        const label = new Date(e.date).toLocaleDateString(undefined, { month: "short", day: "numeric" });
        rows.push({ date: label, ts: new Date(e.date).getTime(), [examId]: pct });
      });
    });
    return rows.sort((a, b) => (a.ts as number) - (b.ts as number));
  }, [progress, examIds]);

  const toggleExam = (id: string) => {
    setActiveExams((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (examIds.length === 0) {
    return (
      <Card className="p-8 text-center">
        <TrendingUp className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
        <h3 className="font-serif text-lg text-foreground mb-1">My Progress</h3>
        <p className="text-sm text-muted-foreground">
          Complete a simulation to see your score progression here.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="font-serif text-lg text-foreground">My Progress</h3>
        </div>
        <Badge variant="secondary" className="text-xs">
          {Object.values(progress).reduce((a, b) => a + b.length, 0)} attempts
        </Badge>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {examIds.map((id) => {
          const isActive = activeExams.has(id);
          return (
            <button
              key={id}
              onClick={() => toggleExam(id)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                isActive
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-accent"
              }`}
            >
              {id} ({progress[id].length})
            </button>
          );
        })}
      </div>

      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11 }}
              stroke="hsl(var(--muted-foreground))"
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(v: number) => [`${v}%`, ""]}
            />
            <ReferenceLine
              y={60}
              stroke="hsl(var(--success))"
              strokeDasharray="4 4"
              label={{ value: "Pass 60%", position: "right", fontSize: 10, fill: "hsl(var(--success))" }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {examIds.map((id, i) =>
              activeExams.has(id) ? (
                <Line
                  key={id}
                  type="monotone"
                  dataKey={id}
                  stroke={LINE_COLORS[i % LINE_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  connectNulls
                />
              ) : null,
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

const COUNTRIES = [
  { code: "SA", flag: "🇸🇦", name: "Saudi Arabia" },
  { code: "AE", flag: "🇦🇪", name: "United Arab Emirates" },
  { code: "QA", flag: "🇶🇦", name: "Qatar" },
  { code: "KW", flag: "🇰🇼", name: "Kuwait" },
  { code: "BH", flag: "🇧🇭", name: "Bahrain" },
  { code: "OM", flag: "🇴🇲", name: "Oman" },
  { code: "UK", flag: "🇬🇧", name: "International — UK (MRCOG)" },
  { code: "US", flag: "🇺🇸", name: "International — US (ABOG)" },
] as const;

export default function Exams() {
  const navigate = useNavigate();
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [activeExam, setActiveExam] = useState<ExamMeta | null>(null);

  const filteredExams = selectedCountry
    ? EXAMS.filter((e) => e.countryCode === selectedCountry)
    : EXAMS;

  // Simulator view
  if (activeExam) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <ExamSimulator exam={activeExam} onExit={() => setActiveExam(null)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-paper text-foreground relative tabular-nums">
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04] mix-blend-multiply"
        style={{ backgroundImage: "radial-gradient(hsl(0 0% 10%) 1px, transparent 1px)", backgroundSize: "3px 3px" }}
        aria-hidden="true"
      />
      <div className="h-[3px] gradient-gold relative z-20" />

      {/* Editorial Header */}
      <header className="header-fade sticky top-0 z-20 border-b border-border/50 bg-card/85 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-5 pt-4 pb-3">
          {/* Eyebrow line */}
          <div className="flex items-center justify-between mb-3 text-[9px] tracking-[0.22em] uppercase font-bold text-muted-foreground">
            <Link to="/" className="flex items-center gap-1.5 hover:text-foreground transition">
              <ArrowLeft className="w-3 h-3" />
              <span>Home</span>
            </Link>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-1 h-1 rounded-full bg-gold" />
              <span className="text-gold/90">Licensing Hub</span>
            </span>
            <Button variant="outline" size="sm" onClick={() => navigate("/exams/compare")} className="h-7 text-[10px] uppercase tracking-wider font-bold">
              <GitCompare className="h-3 w-3 mr-1.5" />
              Compare
            </Button>
          </div>

          {/* Masthead title */}
          <div className="mb-3">
            <h1 className="font-editorial italic font-black tracking-tight leading-[1.02] text-[28px] sm:text-[34px] text-foreground">
              <span className="relative inline-block">
                <span className="bg-clip-text text-transparent bg-[linear-gradient(110deg,hsl(var(--foreground))_0%,hsl(var(--primary))_50%,hsl(var(--foreground))_100%)]">
                  Practice. Simulate. Pass.
                </span>
                <span aria-hidden="true" className="absolute left-0 -bottom-1.5 h-[2px] w-full origin-left bg-gradient-to-r from-primary via-primary/50 to-transparent" />
              </span>
            </h1>
            <p className="mt-3 text-[11px] sm:text-[12px] text-muted-foreground tracking-wide">
              Gulf Licensing Exams · OB/GYN
            </p>
          </div>
          <div className="divider-editorial" aria-hidden="true" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-5 py-6 space-y-7">
        {/* Intro paragraph */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl"
        >
          <p className="text-[13px] sm:text-sm text-muted-foreground leading-relaxed">
            Every Pearson VUE &amp; Prometric OB/GYN licensing exam in the Gulf — with real-time exam simulation,
            AI-generated questions and curated MCQs from RCOG, ACOG and Williams Obstetrics.
          </p>
        </motion.section>

        {/* Progress chart */}
        <ProgressChart />

        {/* Country filter */}
        <section>
          <h2 className="font-serif text-xl text-foreground mb-3">Choose your country</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => setSelectedCountry(null)}
              className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                selectedCountry === null
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:border-accent"
              }`}
            >
              All ({EXAMS.length})
            </button>
            {COUNTRIES.map((c) => {
              const count = EXAMS.filter((e) => e.countryCode === c.code).length;
              if (count === 0) return null;
              return (
                <button
                  key={c.code}
                  onClick={() => setSelectedCountry(c.code)}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all flex items-center gap-2 justify-center ${
                    selectedCountry === c.code
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:border-accent"
                  }`}
                >
                  <span className="text-base">{c.flag}</span>
                  <span className="truncate">{c.name.split(" — ")[0]}</span>
                  <Badge variant="secondary" className="text-xs">{count}</Badge>
                </button>
              );
            })}
          </div>
        </section>

        {/* Exam grid */}
        <section className="grid sm:grid-cols-2 gap-4">
          {filteredExams.map((exam, i) => (
            <motion.div
              key={exam.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card className="p-5 h-full flex flex-col gap-4 hover:shadow-[var(--shadow-editorial)] transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{exam.flag}</span>
                      <Badge
                        variant="outline"
                        className={
                          exam.platform === "Pearson VUE"
                            ? "border-primary text-primary"
                            : "border-accent text-accent"
                        }
                      >
                        {exam.platform}
                      </Badge>
                    </div>
                    <h3 className="font-serif text-lg text-foreground leading-tight">
                      {exam.examName}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {exam.authority} · {exam.country}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2 rounded bg-muted text-center">
                    <FileText className="h-3.5 w-3.5 mx-auto text-muted-foreground mb-1" />
                    <div className="font-mono font-semibold text-foreground">{exam.questions}</div>
                    <div className="text-muted-foreground">Qs</div>
                  </div>
                  <div className="p-2 rounded bg-muted text-center">
                    <Clock className="h-3.5 w-3.5 mx-auto text-muted-foreground mb-1" />
                    <div className="font-mono font-semibold text-foreground text-[11px] leading-tight">
                      {exam.duration}
                    </div>
                  </div>
                  <div className="p-2 rounded bg-muted text-center">
                    <Trophy className="h-3.5 w-3.5 mx-auto text-muted-foreground mb-1" />
                    <div className="font-mono font-semibold text-foreground text-[11px] leading-tight">
                      {exam.passMark}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2">{exam.notes}</p>

                <div className="flex flex-wrap gap-1">
                  {exam.syllabus.slice(0, 3).map((s) => (
                    <Badge key={s} variant="secondary" className="text-[10px]">
                      {s}
                    </Badge>
                  ))}
                  {exam.syllabus.length > 3 && (
                    <Badge variant="secondary" className="text-[10px]">
                      +{exam.syllabus.length - 3}
                    </Badge>
                  )}
                </div>

                <div className="flex gap-2 mt-auto pt-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => setActiveExam(exam)}
                  >
                    <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                    Simulate
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <a href={exam.registerUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </section>

        <p className="text-xs text-center text-muted-foreground">
          Fees and dates are indicative. Always verify with the official authority before registering.
        </p>
      </main>

      {/* Disclaimer above footer */}
      <div className="max-w-6xl mx-auto px-4 sm:px-5 pt-2 pb-5">
        <DisclaimerBanner />
      </div>

      <footer className="border-t border-border/50 bg-card/40">
        <div className="max-w-6xl mx-auto px-5 pt-5 pb-8">
          <div className="divider-editorial mb-3" aria-hidden="true" />
          <p className="text-center text-[10px] text-muted-foreground tabular-nums">
            © {new Intl.NumberFormat("en-US-u-nu-latn").format(new Date().getFullYear())} Tips &amp; Tricks · Licensing Hub
          </p>
        </div>
      </footer>
    </div>
  );
}
