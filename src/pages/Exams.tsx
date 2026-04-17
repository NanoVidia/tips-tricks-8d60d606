import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ExternalLink, GitCompare, Trophy, Clock, FileText, BookOpen, TrendingUp } from "lucide-react";
import { EXAMS, type ExamMeta } from "@/data/examsData";
import { ExamSimulator } from "@/components/exams/ExamSimulator";
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/exams/compare")}>
              <GitCompare className="h-4 w-4 mr-2" />
              Compare
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3"
        >
          <Badge variant="secondary" className="uppercase tracking-wider text-xs">
            Gulf Licensing Exams · OB/GYN
          </Badge>
          <h1 className="font-serif text-4xl sm:text-5xl text-foreground">
            Practice. Simulate. Pass.
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Every Pearson VUE & Prometric OB/GYN licensing exam in the Gulf — with real-time exam simulation,
            AI-generated questions and curated MCQs from RCOG, ACOG and Williams Obstetrics.
          </p>
        </motion.section>

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
    </div>
  );
}
