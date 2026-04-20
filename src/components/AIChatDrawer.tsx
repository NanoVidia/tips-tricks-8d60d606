import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2, Target, Bookmark, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";
import { InlineDisclaimer } from "@/components/Disclaimer";
import { useSavedChats } from "@/hooks/useSavedChats";


interface Scenario {
  title_en: string;
  situation_en: string;
  action_en: string;
  script_en: string;
}

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

async function streamChat({
  messages,
  scenario,
  onDelta,
  onDone,
  onError,
}: {
  messages: Msg[];
  scenario: Scenario;
  onDelta: (t: string) => void;
  onDone: () => void;
  onError: (msg: string) => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages, scenario }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: "Unknown error" }));
    onError(err.error || `Error ${resp.status}`);
    return;
  }

  if (!resp.body) { onError("No response body"); return; }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buf.indexOf("\n")) !== -1) {
      let line = buf.slice(0, idx);
      buf = buf.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") { onDone(); return; }
      try {
        const c = JSON.parse(json).choices?.[0]?.delta?.content;
        if (c) onDelta(c);
      } catch { /* partial */ }
    }
  }
  onDone();
}

interface AIChatDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scenario: Scenario | null;
}

export function AIChatDrawer({ open, onOpenChange, scenario }: AIChatDrawerProps) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [savedKeys, setSavedKeys] = useState<Set<number>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);
  const { save: saveChat } = useSavedChats();

  useEffect(() => {
    if (!open) { setMessages([]); setInput(""); setSavedKeys(new Set()); }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSaveExchange = (assistantIdx: number) => {
    const assistant = messages[assistantIdx];
    if (!assistant || assistant.role !== "assistant" || !assistant.content.trim()) return;
    let question = "";
    for (let i = assistantIdx - 1; i >= 0; i--) {
      if (messages[i].role === "user") { question = messages[i].content; break; }
    }
    saveChat({
      scenarioTitle: scenario?.title_en || "Scenario",
      question,
      answer: assistant.content,
    });
    setSavedKeys((prev) => new Set(prev).add(assistantIdx));
    toast.success("Saved to bookmarks ⭐");
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || !scenario || loading) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    setMessages((p) => [...p, userMsg]);
    setInput("");
    setLoading(true);

    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    await streamChat({
      messages: [...messages, userMsg],
      scenario,
      onDelta: upsert,
      onDone: () => setLoading(false),
      onError: (msg) => {
        toast.error(msg);
        setLoading(false);
      },
    });
  };

  const send = () => sendMessage(input);

  const askHardQuestion = () => {
    sendMessage(
      `🎯 **Challenge me!** Based on the current scenario (${scenario?.title_en}), ask me ONE advanced OSCE-style question to test my clinical reasoning.

Rules:
- Make it a realistic high-stakes vignette (numbers, vitals, exam findings, lab values).
- Focus on a tricky decision point: next best step, anticipating a complication, recognizing a subtle sign, choosing the right maneuver, or avoiding a pitfall.
- Give me 4 plausible options (A/B/C/D) — make the distractors tempting, not obvious.
- DO NOT reveal the answer yet. End with: "💭 Take your time. Reply with A/B/C/D and your reasoning, and I'll grade you like an examiner."
- After I answer, give me an examiner-style feedback: ✅ correct/❌ wrong, why each option is right or wrong, the underlying mechanism, the pearl, and the guideline reference.`
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] flex flex-col rounded-t-2xl">
        <SheetHeader className="pb-2 border-b border-border/50">
          <SheetTitle className="text-base md:text-lg font-semibold truncate">
            ✨ AI — {scenario?.title_en || ""}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-2 space-y-3 min-h-0">
          {messages.length === 0 && (
            <div className="px-1 pb-2">
              {/* Compact greeting */}
              <div className="text-center mb-3">
                <p className="text-[13px] font-semibold text-foreground">👋 Ask anything about this scenario</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Pick a quick action or type your question</p>
              </div>

              {/* Challenge Me — hero CTA */}
              <Button
                onClick={askHardQuestion}
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-primary via-primary to-primary/80 hover:opacity-95 shadow-md shadow-primary/25 h-11 font-bold tracking-wide mb-3"
              >
                <Target className="w-4 h-4 mr-2" />
                Challenge Me — OSCE-style MCQ
              </Button>

              {/* 2×3 Quick-prompt grid — professional, scannable */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { emoji: "🚩", label: "Red flags", hint: "Don't-miss signs", gradient: "from-rose-500/10 to-red-500/5", border: "border-rose-500/25", prompt: `What are the key red flags & danger signs I must NOT miss in "${scenario?.title_en}"? Give me the "don't be that doctor" list.` },
                  { emoji: "🎯", label: "Next best step", hint: "Decision now", gradient: "from-sky-500/10 to-blue-500/5", border: "border-sky-500/25", prompt: `In "${scenario?.title_en}", what is the single next best step right now? Justify in 3 lines max.` },
                  { emoji: "🔪", label: "Surgical pearls", hint: "Tricks & ladders", gradient: "from-amber-500/10 to-orange-500/5", border: "border-amber-500/25", prompt: `Share 3 surgical/procedural pearls or tricks specific to "${scenario?.title_en}" — anatomic landmarks, hand positions, or "if A fails, do B" ladders.` },
                  { emoji: "💊", label: "Drug doses", hint: "Exact & safe", gradient: "from-emerald-500/10 to-teal-500/5", border: "border-emerald-500/25", prompt: `List the exact drug doses, routes, and contraindications relevant to "${scenario?.title_en}". Be precise.` },
                  { emoji: "📚", label: "Guideline", hint: "ACOG · RCOG", gradient: "from-violet-500/10 to-indigo-500/5", border: "border-violet-500/25", prompt: `What does the most recent ACOG/RCOG/FIGO guideline say about "${scenario?.title_en}"? Cite year and bulletin number.` },
                  { emoji: "🗣️", label: "Counsel patient", hint: "Empathic script", gradient: "from-pink-500/10 to-rose-500/5", border: "border-pink-500/25", prompt: `Script how I should counsel the patient in "${scenario?.title_en}" — empathetic, clear, in plain language.` },
                ].map((chip) => (
                  <button
                    key={chip.label}
                    onClick={() => sendMessage(chip.prompt)}
                    disabled={loading}
                    className={`group relative overflow-hidden text-left p-2.5 rounded-xl bg-gradient-to-br ${chip.gradient} border ${chip.border} hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg leading-none mt-0.5">{chip.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-bold text-foreground leading-tight">{chip.label}</p>
                        <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 truncate">{chip.hint}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => {
            const isAssistant = m.role === "assistant";
            const isSaved = savedKeys.has(i);
            return (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[88%] space-y-1.5 ${m.role === "user" ? "items-end" : "items-start"}`}>
                  <div className={`rounded-2xl px-4 py-3 text-[15px] leading-relaxed ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}>
                    {isAssistant ? (
                      <div className="prose prose-base dark:prose-invert max-w-none prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-2 prose-h1:text-lg prose-h2:text-base prose-h3:text-base prose-p:my-2 prose-li:my-0.5 prose-strong:text-foreground prose-code:text-[13px]">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    ) : m.content}
                  </div>
                  {isAssistant && m.content && (
                    <div className="flex items-center gap-2">
                      <InlineDisclaimer />
                      <button
                        onClick={() => !isSaved && handleSaveExchange(i)}
                        disabled={isSaved || loading}
                        className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border transition ${
                          isSaved
                            ? "bg-warning-soft border-warning/40 text-warning"
                            : "border-border/50 text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                        }`}
                        title={isSaved ? "Saved" : "Save chat"}
                      >
                        {isSaved ? <BookmarkCheck className="w-3 h-3" /> : <Bookmark className="w-3 h-3" />}
                        {isSaved ? "Saved" : "Save"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {loading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl px-4 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {messages.length > 0 && (
          <div className="flex gap-2 pt-2 overflow-x-auto scrollbar-none border-t border-border/50">
            <Button
              onClick={askHardQuestion}
              disabled={loading}
              size="sm"
              variant="outline"
              className="rounded-full text-xs h-8 shrink-0 border-primary/40 text-primary hover:bg-primary/10 hover:border-primary/60 font-semibold tracking-wide shadow-sm"
            >
              <Target className="w-3.5 h-3.5 mr-1" />
              Challenge Me
            </Button>
            {[
              { emoji: "🚩", label: "Red flags", prompt: `What are the key red flags & danger signs I must NOT miss in "${scenario?.title_en}"? Give me the "don't be that doctor" list.` },
              { emoji: "🎯", label: "Next step", prompt: `In "${scenario?.title_en}", what is the single next best step right now? Justify in 3 lines max.` },
              { emoji: "🔪", label: "Pearls", prompt: `Share 3 surgical/procedural pearls or tricks specific to "${scenario?.title_en}" — anatomic landmarks, hand positions, or "if A fails, do B" ladders.` },
              { emoji: "💊", label: "Doses", prompt: `List the exact drug doses, routes, and contraindications relevant to "${scenario?.title_en}". Be precise.` },
              { emoji: "📚", label: "Guideline", prompt: `What does the most recent ACOG/RCOG/FIGO guideline say about "${scenario?.title_en}"? Cite year and bulletin number.` },
              { emoji: "🗣️", label: "Counsel", prompt: `Script how I should counsel the patient in "${scenario?.title_en}" — empathetic, clear, in plain language.` },
            ].map((c) => (
              <Button
                key={c.label}
                onClick={() => sendMessage(c.prompt)}
                disabled={loading}
                size="sm"
                variant="outline"
                className="rounded-full text-xs h-8 shrink-0 border-border/60 hover:bg-muted hover:border-primary/40 font-medium"
              >
                <span className="mr-1">{c.emoji}</span>
                {c.label}
              </Button>
            ))}
          </div>
        )}

        <div className="flex gap-2 pt-2 border-t border-border/50">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Ask about this scenario..."
            className="flex-1 h-11 rounded-xl text-[15px]"
            disabled={loading}
          />
          <Button size="icon" onClick={send} disabled={loading || !input.trim()} className="rounded-xl h-11 w-11">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
