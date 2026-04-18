import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Trophy,
  BookOpen,
  Loader2,
  Flag,
  Target,
  TrendingUp,
  Timer,
} from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import type { ExamMeta, Topic, Difficulty } from "@/data/examsData";
import { TOPICS } from "@/data/examsData";
import { type MCQ } from "@/data/mcqBank";
import { useAllMcqs, filterMcqList } from "@/hooks/useMcqs";

type Mode = "setup" | "running" | "review";
type ExamMode = "practice" | "mock";

interface Props {
  exam: ExamMeta;
  onExit: () => void;
}

const PROGRESS_KEY_PREFIX = "exam_progress_";
const MOCK_TOTAL_SECONDS = 3 * 60 * 60; // 3 hours
const MOCK_TARGET_COUNT = 150;

export function ExamSimulator({ exam, onExit }: Props) {
  const { mcqs: bankMcqs, source: bankSource, isLoading: bankLoading } = useAllMcqs();
  const [mode, setMode] = useState<Mode>("setup");
  const [examMode, setExamMode] = useState<ExamMode>("practice");
  const [topic, setTopic] = useState<Topic | "All">("All");
  const [difficulty, setDifficulty] = useState<Difficulty | "All">("All");
  const [count, setCount] = useState(10);
  const [useAI, setUseAI] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);

  const [questions, setQuestions] = useState<MCQ[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [submitted, setSubmitted] = useState<boolean[]>([]);
  const [flagged, setFlagged] = useState<boolean[]>([]);
  const [questionTimes, setQuestionTimes] = useState<number[]>([]); // seconds spent per Q
  const [lastEnterAt, setLastEnterAt] = useState<number>(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [startedAt, setStartedAt] = useState<number>(0);
  const [activeMode, setActiveMode] = useState<ExamMode>("practice");

  const isMock = activeMode === "mock";

  // Timer
  useEffect(() => {
    if (mode !== "running") return;
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          finishExam();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Track time-on-question
  useEffect(() => {
    if (mode !== "running") return;
    setLastEnterAt(Date.now());
  }, [current, mode]);

  const recordTimeOnCurrent = () => {
    if (lastEnterAt === 0) return;
    const delta = Math.round((Date.now() - lastEnterAt) / 1000);
    setQuestionTimes((arr) => {
      const next = [...arr];
      next[current] = (next[current] ?? 0) + delta;
      return next;
    });
    setLastEnterAt(Date.now());
  };

  const startExam = async () => {
    const mockMode = examMode === "mock";

    // In mock mode: full bank, no filters, no AI
    let pool: MCQ[] = mockMode
      ? [...bankMcqs]
      : filterMcqList(bankMcqs, { examId: exam.id, topic, difficulty });

    if (!mockMode && useAI) {
      setLoadingAI(true);
      try {
        const { data, error } = await supabase.functions.invoke("generate-mcq", {
          body: {
            examName: exam.examName,
            authority: exam.authority,
            topic: topic === "All" ? "Mixed OB/GYN topics" : topic,
            difficulty: difficulty === "All" ? "medium" : difficulty,
            count: Math.min(count, 15),
          },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        const aiQs: MCQ[] = (data?.questions ?? []).map((q: MCQ, i: number) => ({
          id: `ai-${Date.now()}-${i}`,
          topic: (topic === "All" ? "Antenatal Care" : topic) as Topic,
          difficulty: (difficulty === "All" ? "medium" : difficulty) as Difficulty,
          exams: [exam.id],
          stem: q.stem,
          options: q.options,
          answerIndex: q.answerIndex,
          explanation: q.explanation,
          reference: q.reference,
        }));
        pool = [...aiQs, ...pool];
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "AI generation failed — falling back to bank");
      } finally {
        setLoadingAI(false);
      }
    }

    if (pool.length === 0) {
      toast.error("No questions match these filters. Try widening filters or enable AI.");
      return;
    }

    const targetCount = mockMode ? Math.min(MOCK_TARGET_COUNT, pool.length) : count;
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, targetCount);

    if (mockMode && shuffled.length < MOCK_TARGET_COUNT) {
      toast.warning(`Mock exam will use ${shuffled.length} questions (full bank).`);
    }

    setQuestions(shuffled);
    setAnswers(Array(shuffled.length).fill(null));
    setSubmitted(Array(shuffled.length).fill(false));
    setFlagged(Array(shuffled.length).fill(false));
    setQuestionTimes(Array(shuffled.length).fill(0));
    setCurrent(0);
    setSecondsLeft(mockMode ? MOCK_TOTAL_SECONDS : shuffled.length * 72);
    setStartedAt(Date.now());
    setLastEnterAt(Date.now());
    setActiveMode(examMode);
    setMode("running");
  };

  const finishExam = () => {
    recordTimeOnCurrent();
    setMode("review");
    const score = answers.reduce<number>(
      (acc, a, i) => (a !== null && a === questions[i]?.answerIndex ? acc + 1 : acc),
      0,
    );
    const result = {
      examId: exam.id,
      date: new Date().toISOString(),
      total: questions.length,
      score,
      durationSec: Math.round((Date.now() - startedAt) / 1000),
      mode: activeMode,
    };
    try {
      const key = PROGRESS_KEY_PREFIX + exam.id;
      const prev = JSON.parse(localStorage.getItem(key) || "[]");
      localStorage.setItem(key, JSON.stringify([result, ...prev].slice(0, 20)));
    } catch {}
  };

  const submitCurrent = () => {
    if (answers[current] === null) {
      toast.error("Please select an answer");
      return;
    }
    setSubmitted((s) => s.map((v, i) => (i === current ? true : v)));
  };

  const select = (idx: number) => {
    if (isMock) {
      // In mock mode answers are mutable until exam ends; never reveal correctness.
      setAnswers((a) => a.map((v, i) => (i === current ? idx : v)));
      return;
    }
    if (submitted[current]) return;
    setAnswers((a) => a.map((v, i) => (i === current ? idx : v)));
  };

  const toggleFlag = () => {
    setFlagged((f) => f.map((v, i) => (i === current ? !v : v)));
  };

  const goTo = (i: number) => {
    if (i < 0 || i >= questions.length) return;
    recordTimeOnCurrent();
    setCurrent(i);
  };

  const next = () => {
    if (current < questions.length - 1) goTo(current + 1);
    else finishExam();
  };

  const prev = () => current > 0 && goTo(current - 1);

  const fmtTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h > 0 ? h + ":" : ""}${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const score = useMemo(
    () =>
      answers.reduce<number>(
        (acc, a, i) => (a !== null && a === questions[i]?.answerIndex ? acc + 1 : acc),
        0,
      ),
    [answers, questions],
  );

  // Topic / difficulty breakdowns for the report
  const topicBreakdown = useMemo(() => {
    const map = new Map<string, { total: number; correct: number; attempted: number }>();
    questions.forEach((q, i) => {
      const t = q.topic;
      if (!map.has(t)) map.set(t, { total: 0, correct: 0, attempted: 0 });
      const e = map.get(t)!;
      e.total += 1;
      if (answers[i] !== null) e.attempted += 1;
      if (answers[i] !== null && answers[i] === q.answerIndex) e.correct += 1;
    });
    return Array.from(map.entries())
      .map(([topic, v]) => ({
        topic,
        ...v,
        pct: v.total ? Math.round((v.correct / v.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [questions, answers]);

  const difficultyBreakdown = useMemo(() => {
    const order: Difficulty[] = ["easy", "medium", "hard"];
    return order
      .map((d) => {
        const idxs = questions
          .map((q, i) => (q.difficulty === d ? i : -1))
          .filter((i) => i >= 0);
        const correct = idxs.filter((i) => answers[i] === questions[i].answerIndex).length;
        return {
          difficulty: d,
          total: idxs.length,
          correct,
          pct: idxs.length ? Math.round((correct / idxs.length) * 100) : 0,
        };
      })
      .filter((r) => r.total > 0);
  }, [questions, answers]);

  const timeStats = useMemo(() => {
    const valid = questionTimes.filter((t) => t > 0);
    if (valid.length === 0) return { avg: 0, min: 0, max: 0 };
    return {
      avg: Math.round(valid.reduce((a, b) => a + b, 0) / valid.length),
      min: Math.min(...valid),
      max: Math.max(...valid),
    };
  }, [questionTimes]);

  // Pass mark from exam metadata (e.g. "60%", "≥60%")
  const passMarkPct = useMemo(() => {
    const m = exam.passMark.match(/(\d+)/);
    return m ? parseInt(m[1], 10) : 60;
  }, [exam.passMark]);

  const weaknessBadge = (pct: number) => {
    if (pct >= 75) return { label: "Strong", cls: "bg-success-soft text-success border-success/30" };
    if (pct >= 60) return { label: "Adequate", cls: "bg-info-soft text-info border-info/30" };
    return { label: "Needs review", cls: "bg-danger-soft text-danger border-danger/30" };
  };

  // ============ SETUP ============
  if (mode === "setup") {
    const mockOn = examMode === "mock";
    return (
      <Card className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-2xl text-foreground">Configure your simulator</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {exam.examName} · {exam.authority}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onExit}>
            ← Exit
          </Button>
        </div>

        {/* Mock Exam toggle */}
        <div className="flex items-start gap-3 p-4 rounded-lg border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
          <Target className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="font-semibold text-foreground">🎯 Mock Exam Mode</span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  150 questions · 3 hours · no feedback until end · real exam conditions
                </p>
              </div>
              <Switch
                checked={mockOn}
                onCheckedChange={(v) => setExamMode(v ? "mock" : "practice")}
              />
            </div>
          </div>
        </div>

        {!mockOn && (
          <>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Topic</label>
                <Select value={topic} onValueChange={(v) => setTopic(v as Topic | "All")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All topics (mixed)</SelectItem>
                    {TOPICS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Difficulty</label>
                <Select
                  value={difficulty}
                  onValueChange={(v) => setDifficulty(v as Difficulty | "All")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All levels</SelectItem>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-foreground">Number of questions</label>
                <Badge variant="secondary" className="font-mono">
                  {count}
                </Badge>
              </div>
              <Slider
                value={[count]}
                onValueChange={(v) => setCount(v[0])}
                min={5}
                max={150}
                step={5}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Real exam: {exam.questions} questions in {exam.duration}. Timer scales automatically
                (~72 s / question).
              </p>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg border border-accent/30 bg-accent/5">
              <Sparkles className="h-5 w-5 text-accent shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">AI-generated questions</span>
                  <Button
                    size="sm"
                    variant={useAI ? "default" : "outline"}
                    onClick={() => setUseAI(!useAI)}
                  >
                    {useAI ? "Enabled" : "Disabled"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Mix our curated bank with fresh AI-written MCQs (RCOG/ACOG/Williams calibrated).
                </p>
              </div>
            </div>
          </>
        )}

        {mockOn && (
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Questions</span>
              <span className="font-mono font-semibold text-foreground">
                {Math.min(MOCK_TARGET_COUNT, bankMcqs.length)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Duration</span>
              <span className="font-mono font-semibold text-foreground">3:00:00</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Pass mark</span>
              <span className="font-mono font-semibold text-foreground">{exam.passMark}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Feedback</span>
              <span className="text-foreground">Hidden until exam ends</span>
            </div>
            {bankMcqs.length < MOCK_TARGET_COUNT && (
              <p className="text-xs text-warning pt-2">
                ⚠ Bank has {bankMcqs.length} questions. Mock will use the full bank.
              </p>
            )}
          </div>
        )}

        <Button size="lg" className="w-full" onClick={startExam} disabled={loadingAI}>
          {loadingAI ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating with AI…
            </>
          ) : (
            <>
              <Trophy className="h-4 w-4 mr-2" />
              {mockOn ? "Begin Mock Exam" : "Start Simulation"}
            </>
          )}
        </Button>
      </Card>
    );
  }

  // ============ RUNNING ============
  if (mode === "running") {
    const q = questions[current];
    const isSubmitted = submitted[current];
    const userAnswer = answers[current];
    const correct = q.answerIndex;
    const showFeedback = !isMock && isSubmitted;

    const answeredCount = answers.filter((a) => a !== null).length;
    const flaggedCount = flagged.filter(Boolean).length;

    return (
      <div className="space-y-4">
        {/* Header bar */}
        <Card className="p-4 flex items-center justify-between sticky top-0 z-10 bg-card/95 backdrop-blur">
          <div className="flex items-center gap-3 text-sm flex-wrap">
            <Badge variant="outline" className="font-mono">
              {current + 1} / {questions.length}
            </Badge>
            {isMock ? (
              <Badge className="bg-primary/10 text-primary border-primary/30">🎯 Mock</Badge>
            ) : (
              <Badge variant="secondary">{q.topic}</Badge>
            )}
            {isMock && (
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {answeredCount} answered · {flaggedCount} flagged
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm font-mono text-foreground">
            <Clock
              className={`h-4 w-4 ${
                secondsLeft < 300 ? "text-danger animate-pulse" : "text-muted-foreground"
              }`}
            />
            {fmtTime(secondsLeft)}
          </div>
        </Card>

        <Progress value={((current + 1) / questions.length) * 100} className="h-1" />

        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="p-6 space-y-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-foreground leading-relaxed font-serif text-lg flex-1">
                  {q.stem}
                </p>
                <Button
                  variant={flagged[current] ? "default" : "outline"}
                  size="sm"
                  onClick={toggleFlag}
                  className="shrink-0"
                  title="Flag for review"
                >
                  <Flag className={`h-4 w-4 ${flagged[current] ? "fill-current" : ""}`} />
                </Button>
              </div>

              <div className="space-y-2">
                {q.options.map((opt, i) => {
                  const isUser = userAnswer === i;
                  const isCorrect = i === correct;
                  let cls = "border-border hover:border-accent hover:bg-accent/5";
                  if (showFeedback) {
                    if (isCorrect) cls = "border-success bg-success-soft text-foreground";
                    else if (isUser && !isCorrect)
                      cls = "border-danger bg-danger-soft text-foreground";
                    else cls = "border-border opacity-60";
                  } else if (isUser) {
                    cls = "border-primary bg-primary/5";
                  }
                  return (
                    <button
                      key={i}
                      onClick={() => select(i)}
                      disabled={showFeedback}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all flex items-start gap-3 ${cls}`}
                    >
                      <span className="font-mono text-sm font-bold w-6 shrink-0">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="text-sm flex-1">{opt}</span>
                      {showFeedback && isCorrect && (
                        <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                      )}
                      {showFeedback && isUser && !isCorrect && (
                        <XCircle className="h-5 w-5 text-danger shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {showFeedback && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-lg bg-info-soft border border-info/30 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-info" />
                    <span className="font-semibold text-foreground text-sm">Explanation</span>
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed">{q.explanation}</p>
                  <p className="text-xs text-muted-foreground italic">Reference: {q.reference}</p>
                </motion.div>
              )}
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Mock navigator */}
        {isMock && (
          <Card className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-foreground">Question navigator</span>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded bg-primary inline-block" />answered
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded bg-warning inline-block" />flagged
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded border border-border inline-block" />unseen
                </span>
              </div>
            </div>
            <div className="grid grid-cols-10 gap-1 max-h-40 overflow-y-auto">
              {questions.map((_, i) => {
                const isAnswered = answers[i] !== null;
                const isFlag = flagged[i];
                const isCurr = i === current;
                let cls = "border border-border bg-card text-muted-foreground";
                if (isAnswered) cls = "bg-primary text-primary-foreground border-primary";
                if (isFlag) cls = "bg-warning text-warning-foreground border-warning";
                if (isAnswered && isFlag)
                  cls =
                    "bg-gradient-to-br from-primary to-warning text-primary-foreground border-primary";
                if (isCurr) cls += " ring-2 ring-accent ring-offset-1 ring-offset-card";
                return (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className={`text-[10px] font-mono font-semibold h-7 rounded transition-all ${cls}`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </Card>
        )}

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={prev} disabled={current === 0}>
            <ChevronLeft className="h-4 w-4" />
            Prev
          </Button>
          {!isMock && !isSubmitted ? (
            <Button className="flex-1" onClick={submitCurrent}>
              Submit answer
            </Button>
          ) : (
            <Button className="flex-1" onClick={next}>
              {current === questions.length - 1 ? "Finish" : "Next"}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
          {isMock ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  End
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>End the mock exam?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You have answered {answeredCount} of {questions.length} questions. Unanswered
                    questions will be marked incorrect. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep going</AlertDialogCancel>
                  <AlertDialogAction onClick={finishExam}>End exam now</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button variant="ghost" size="sm" onClick={finishExam}>
              End
            </Button>
          )}
        </div>
      </div>
    );
  }

  // ============ REVIEW ============
  const pct = Math.round((score / questions.length) * 100);
  const passed = pct >= passMarkPct;
  const usedSec = Math.round((Date.now() - startedAt) / 1000);
  const flaggedQs = questions.map((q, i) => ({ q, i })).filter(({ i }) => flagged[i]);

  return (
    <div className="space-y-4">
      <Card className="p-8 text-center space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className={`inline-flex h-24 w-24 rounded-full items-center justify-center ${
            passed ? "bg-success-soft" : "bg-danger-soft"
          }`}
        >
          <Trophy className={`h-12 w-12 ${passed ? "text-success" : "text-danger"}`} />
        </motion.div>
        <div>
          <h2 className="font-serif text-3xl text-foreground">
            {score} / {questions.length}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {pct}% — {passed ? `Pass standard met (${exam.passMark})` : `Below pass standard (${exam.passMark})`}
          </p>
          {isMock && (
            <Badge className="mt-2 bg-primary/10 text-primary border-primary/30">
              🎯 Mock Exam
            </Badge>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3 text-xs pt-2">
          <div className="rounded-lg border border-border bg-card p-2">
            <div className="text-muted-foreground">Time used</div>
            <div className="font-mono font-bold text-foreground">{fmtTime(usedSec)}</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-2">
            <div className="text-muted-foreground">Avg / Q</div>
            <div className="font-mono font-bold text-foreground">{timeStats.avg}s</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-2">
            <div className="text-muted-foreground">Flagged</div>
            <div className="font-mono font-bold text-foreground">{flaggedQs.length}</div>
          </div>
        </div>
      </Card>

      {/* Topic chart */}
      {topicBreakdown.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-foreground text-sm">Performance by topic</h3>
          </div>
          <ChartContainer
            config={{ pct: { label: "Score %", color: "hsl(var(--primary))" } }}
            className="h-64 w-full"
          >
            <BarChart data={topicBreakdown} margin={{ top: 5, right: 10, left: -20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="topic"
                angle={-35}
                textAnchor="end"
                interval={0}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              />
              <ReferenceLine
                y={passMarkPct}
                stroke="hsl(var(--danger))"
                strokeDasharray="4 4"
                label={{ value: `Pass ${passMarkPct}%`, fontSize: 10, fill: "hsl(var(--danger))" }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="pct" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>

          <div className="mt-4 space-y-1.5">
            {topicBreakdown.map((t) => {
              const b = weaknessBadge(t.pct);
              return (
                <div
                  key={t.topic}
                  className="flex items-center justify-between text-xs gap-2 p-2 rounded border border-border"
                >
                  <span className="text-foreground font-medium truncate flex-1">{t.topic}</span>
                  <span className="font-mono text-muted-foreground">
                    {t.correct}/{t.total} · {t.pct}%
                  </span>
                  <Badge variant="outline" className={b.cls}>
                    {b.label}
                  </Badge>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Difficulty + time */}
      {difficultyBreakdown.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Timer className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-foreground text-sm">Difficulty & time analysis</h3>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {difficultyBreakdown.map((d) => (
              <div key={d.difficulty} className="rounded-lg border border-border p-2 text-center">
                <div className="text-[10px] text-muted-foreground capitalize">{d.difficulty}</div>
                <div className="font-mono font-bold text-foreground">{d.pct}%</div>
                <div className="text-[10px] text-muted-foreground">
                  {d.correct}/{d.total}
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded border border-border p-2">
              <div className="text-muted-foreground text-[10px]">Avg</div>
              <div className="font-mono font-semibold">{timeStats.avg}s</div>
            </div>
            <div className="rounded border border-border p-2">
              <div className="text-muted-foreground text-[10px]">Fastest</div>
              <div className="font-mono font-semibold">{timeStats.min}s</div>
            </div>
            <div className="rounded border border-border p-2">
              <div className="text-muted-foreground text-[10px]">Slowest</div>
              <div className="font-mono font-semibold">{timeStats.max}s</div>
            </div>
          </div>
        </Card>
      )}

      {/* Flagged */}
      {flaggedQs.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Flag className="h-4 w-4 text-warning" />
            <h3 className="font-semibold text-foreground text-sm">
              Flagged questions ({flaggedQs.length})
            </h3>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {flaggedQs.map(({ q, i }) => {
              const ok = answers[i] === q.answerIndex;
              return (
                <div
                  key={q.id}
                  className={`p-2 rounded border-l-4 text-sm ${
                    ok ? "border-success bg-success-soft/30" : "border-danger bg-danger-soft/30"
                  }`}
                >
                  <span className="text-foreground/80">
                    Q{i + 1}: {q.stem.slice(0, 110)}…
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Full breakdown collapsed */}
      <Card className="p-2">
        <Accordion type="single" collapsible>
          <AccordionItem value="all" className="border-none">
            <AccordionTrigger className="px-2 text-sm font-semibold">
              Full question-by-question review ({questions.length})
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 max-h-96 overflow-y-auto px-2">
                {questions.map((q, i) => {
                  const ok = answers[i] === q.answerIndex;
                  return (
                    <div
                      key={q.id}
                      className={`p-2 rounded border-l-4 text-sm ${
                        ok
                          ? "border-success bg-success-soft/30"
                          : "border-danger bg-danger-soft/30"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {ok ? (
                          <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="h-4 w-4 text-danger shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="text-foreground/80">
                            Q{i + 1}: {q.stem.slice(0, 100)}…
                          </p>
                          {!ok && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Correct: {String.fromCharCode(65 + q.answerIndex)} ·{" "}
                              {q.options[q.answerIndex].slice(0, 70)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={() => setMode("setup")}>
          <RotateCcw className="h-4 w-4 mr-2" />
          New Simulation
        </Button>
        <Button className="flex-1" onClick={onExit}>
          Back to Exam Hub
        </Button>
      </div>
    </div>
  );
}
