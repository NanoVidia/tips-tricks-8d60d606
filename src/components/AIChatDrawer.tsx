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
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) { setMessages([]); setInput(""); }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
          <SheetTitle className="text-sm truncate">
            ✨ AI — {scenario?.title_en || ""}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-3 space-y-3 min-h-0">
          {messages.length === 0 && (
            <div className="text-center text-xs text-muted-foreground py-6 space-y-3">
              <p>👋 Welcome!</p>
              <p>Your medical AI assistant</p>
              <p className="mt-3">Ask anything about this clinical scenario...</p>
              <Button
                onClick={askHardQuestion}
                disabled={loading}
                size="sm"
                className="mt-4 rounded-full bg-gradient-to-r from-primary to-primary/80 hover:opacity-90"
              >
                <Target className="w-4 h-4" />
                اسألني سؤال صعب
              </Button>

              <div className="pt-4 space-y-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                  💡 اقتراحات سريعة
                </p>
                <div className="flex flex-wrap gap-1.5 justify-center px-2">
                  {[
                    { emoji: "🚩", label: "Red flags", prompt: `What are the key red flags & danger signs I must NOT miss in "${scenario?.title_en}"? Give me the "don't be that doctor" list.` },
                    { emoji: "🎯", label: "Next best step", prompt: `In "${scenario?.title_en}", what is the single next best step right now? Justify in 3 lines max.` },
                    { emoji: "🧠", label: "Mnemonic", prompt: `Give me a memorable mnemonic or rule of thumb for managing "${scenario?.title_en}" — the kind seniors actually use.` },
                    { emoji: "🔪", label: "Surgical pearls", prompt: `Share 3 surgical/procedural pearls or tricks specific to "${scenario?.title_en}" — anatomic landmarks, hand positions, or "if A fails, do B" ladders.` },
                    { emoji: "💊", label: "Drug doses", prompt: `List the exact drug doses, routes, and contraindications relevant to "${scenario?.title_en}". Be precise.` },
                    { emoji: "📚", label: "Latest guideline", prompt: `What does the most recent ACOG/RCOG/FIGO guideline say about "${scenario?.title_en}"? Cite year and bulletin number.` },
                    { emoji: "⚠️", label: "Pitfalls", prompt: `What are the top 3 pitfalls or "never do this" warnings in "${scenario?.title_en}"?` },
                    { emoji: "🗣️", label: "Counsel patient", prompt: `Script how I should counsel the patient in "${scenario?.title_en}" — empathetic, clear, in plain language.` },
                  ].map((chip) => (
                    <button
                      key={chip.label}
                      onClick={() => sendMessage(chip.prompt)}
                      disabled={loading}
                      className="text-[11px] px-2.5 py-1 rounded-full bg-muted hover:bg-primary/10 hover:text-primary border border-border/50 transition-colors disabled:opacity-50"
                    >
                      <span className="mr-1">{chip.emoji}</span>
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] space-y-1 ${m.role === "user" ? "items-end" : "items-start"}`}>
                <div className={`rounded-xl px-3 py-2 text-sm ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}>
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  ) : m.content}
                </div>
                {m.role === "assistant" && m.content && <InlineDisclaimer />}
              </div>
            </div>
          ))}
          {loading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-xl px-3 py-2">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {messages.length > 0 && (
          <div className="flex gap-2 pt-2 overflow-x-auto scrollbar-none">
            <Button
              onClick={askHardQuestion}
              disabled={loading}
              size="sm"
              variant="outline"
              className="rounded-full text-xs h-8 shrink-0 border-primary/30 text-primary hover:bg-primary/10"
            >
              <Target className="w-3.5 h-3.5" />
              سؤال صعب
            </Button>
          </div>
        )}

        <div className="flex gap-2 pt-2 border-t border-border/50">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Ask about this scenario..."
            className="flex-1 h-10 rounded-xl"
            disabled={loading}
          />
          <Button size="icon" onClick={send} disabled={loading || !input.trim()} className="rounded-xl">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
