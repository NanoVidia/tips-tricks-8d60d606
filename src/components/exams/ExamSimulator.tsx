import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Clock, Sparkles, RotateCcw, ChevronLeft, ChevronRight, Trophy, BookOpen, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { ExamMeta, Topic, Difficulty } from "@/data/examsData";
import { TOPICS } from "@/data/examsData";
import { filterMCQs, type MCQ } from "@/data/mcqBank";

type Mode = "setup" | "running" | "review";

interface Props {
  exam: ExamMeta;
  onExit: () => void;
}

const PROGRESS_KEY_PREFIX = "exam_progress_";

export function ExamSimulator({ exam, onExit }: Props) {
  const [mode, setMode] = useState<Mode>("setup");
  const [topic, setTopic] = useState<Topic | "All">("All");
  const [difficulty, setDifficulty] = useState<Difficulty | "All">("All");
  const [count, setCount] = useState(10);
  const [useAI, setUseAI] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);

  const [questions, setQuestions] = useState<MCQ[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [submitted, setSubmitted] = useState<boolean[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [startedAt, setStartedAt] = useState<number>(0);

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

  const startExam = async () => {
    let pool: MCQ[] = filterMCQs({
      examId: exam.id,
      topic,
      difficulty,
    });

    if (useAI) {
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

    // Shuffle and slice
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, count);
    setQuestions(shuffled);
    setAnswers(Array(shuffled.length).fill(null));
    setSubmitted(Array(shuffled.length).fill(false));
    setCurrent(0);
    setSecondsLeft(shuffled.length * 72); // ~72s per question (mirrors 3h/150q ≈ 72s)
    setStartedAt(Date.now());
    setMode("running");
  };

  const finishExam = () => {
    setMode("review");
    // persist last result
    const score = answers.reduce<number>((acc, a, i) => (a !== null && a === questions[i]?.answerIndex ? acc + 1 : acc), 0);
    const result = {
      examId: exam.id,
      date: new Date().toISOString(),
      total: questions.length,
      score,
      durationSec: Math.round((Date.now() - startedAt) / 1000),
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
    if (submitted[current]) return;
    setAnswers((a) => a.map((v, i) => (i === current ? idx : v)));
  };

  const next = () => {
    if (current < questions.length - 1) {
      setCurrent(current + 1);
    } else {
      finishExam();
    }
  };

  const prev = () => current > 0 && setCurrent(current - 1);

  const fmtTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h > 0 ? h + ":" : ""}${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const score = useMemo(
    () => answers.reduce<number>((acc, a, i) => (a !== null && a === questions[i]?.answerIndex ? acc + 1 : acc), 0),
    [answers, questions]
  );

  // ============ SETUP ============
  if (mode === "setup") {
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
            <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty | "All")}>
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
            <Badge variant="secondary" className="font-mono">{count}</Badge>
          </div>
          <Slider value={[count]} onValueChange={(v) => setCount(v[0])} min={5} max={150} step={5} />
          <p className="text-xs text-muted-foreground mt-2">
            Real exam: {exam.questions} questions in {exam.duration}. Timer scales automatically (~72 s / question).
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

        <Button
          size="lg"
          className="w-full"
          onClick={startExam}
          disabled={loadingAI}
        >
          {loadingAI ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating with AI…
            </>
          ) : (
            <>
              <Trophy className="h-4 w-4 mr-2" />
              Start Simulation
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

    return (
      <div className="space-y-4">
        {/* Header bar */}
        <Card className="p-4 flex items-center justify-between sticky top-0 z-10 bg-card/95 backdrop-blur">
          <div className="flex items-center gap-3 text-sm">
            <Badge variant="outline" className="font-mono">
              {current + 1} / {questions.length}
            </Badge>
            <Badge variant="secondary">{q.topic}</Badge>
          </div>
          <div className="flex items-center gap-2 text-sm font-mono text-foreground">
            <Clock className={`h-4 w-4 ${secondsLeft < 60 ? "text-danger animate-pulse" : "text-muted-foreground"}`} />
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
              <p className="text-foreground leading-relaxed font-serif text-lg">{q.stem}</p>

              <div className="space-y-2">
                {q.options.map((opt, i) => {
                  const isUser = userAnswer === i;
                  const isCorrect = i === correct;
                  let cls = "border-border hover:border-accent hover:bg-accent/5";
                  if (isSubmitted) {
                    if (isCorrect) cls = "border-success bg-success-soft text-foreground";
                    else if (isUser && !isCorrect) cls = "border-danger bg-danger-soft text-foreground";
                    else cls = "border-border opacity-60";
                  } else if (isUser) {
                    cls = "border-primary bg-primary/5";
                  }
                  return (
                    <button
                      key={i}
                      onClick={() => select(i)}
                      disabled={isSubmitted}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all flex items-start gap-3 ${cls}`}
                    >
                      <span className="font-mono text-sm font-bold w-6 shrink-0">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="text-sm flex-1">{opt}</span>
                      {isSubmitted && isCorrect && <CheckCircle2 className="h-5 w-5 text-success shrink-0" />}
                      {isSubmitted && isUser && !isCorrect && <XCircle className="h-5 w-5 text-danger shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {isSubmitted && (
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

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={prev} disabled={current === 0}>
            <ChevronLeft className="h-4 w-4" />
            Prev
          </Button>
          {!isSubmitted ? (
            <Button className="flex-1" onClick={submitCurrent}>
              Submit answer
            </Button>
          ) : (
            <Button className="flex-1" onClick={next}>
              {current === questions.length - 1 ? "Finish" : "Next"}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={finishExam}>
            End
          </Button>
        </div>
      </div>
    );
  }

  // ============ REVIEW ============
  const pct = Math.round((score / questions.length) * 100);
  const passed = pct >= 60;

  return (
    <div className="space-y-4">
      <Card className="p-8 text-center space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className={`inline-flex h-24 w-24 rounded-full items-center justify-center ${passed ? "bg-success-soft" : "bg-danger-soft"}`}
        >
          <Trophy className={`h-12 w-12 ${passed ? "text-success" : "text-danger"}`} />
        </motion.div>
        <div>
          <h2 className="font-serif text-3xl text-foreground">
            {score} / {questions.length}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {pct}% — {passed ? "Pass standard met (≥60%)" : "Below pass standard"}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Time taken: {fmtTime(Math.round((Date.now() - startedAt) / 1000))}
        </p>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold text-foreground mb-3 text-sm">Question breakdown</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {questions.map((q, i) => {
            const ok = answers[i] === q.answerIndex;
            return (
              <div
                key={q.id}
                className={`p-2 rounded border-l-4 ${ok ? "border-success bg-success-soft/30" : "border-danger bg-danger-soft/30"} text-sm`}
              >
                <div className="flex items-start gap-2">
                  {ok ? (
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-4 w-4 text-danger shrink-0 mt-0.5" />
                  )}
                  <span className="line-clamp-2 text-foreground/80">
                    Q{i + 1}: {q.stem.slice(0, 100)}…
                  </span>
                </div>
              </div>
            );
          })}
        </div>
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
