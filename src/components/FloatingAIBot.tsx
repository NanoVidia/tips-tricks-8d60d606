import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2, X, Bot, Wrench, CheckCircle2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { executeTool, TOOL_LABELS, getSaveTarget, buildSaveToToolsUrl, stashPrefill } from "@/lib/aiTools";

type ToolCall = { id: string; name: string; args: string };
type Msg = {
  role: "user" | "assistant" | "tool";
  content: string;
  tool_calls?: { id: string; type: "function"; function: { name: string; arguments: string } }[];
  tool_call_id?: string;
  /** UI-only: tool calls executed by THIS assistant turn, for inline chips + Save-to-Tools button */
  uiTools?: { name: string; ok: boolean; args: string }[];
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
const SCENARIO = {
  title_en: "General OB/GYN Assistant",
  situation_en: "The doctor is asking a general obstetrics and gynecology question.",
  action_en: "Provide evidence-based, professional medical guidance. Use tools for any calculation or drug lookup.",
  script_en: "Answer as a knowledgeable OB/GYN consultant.",
};

/** One streaming round-trip with the gateway. Returns assistant text + any tool_calls. */
async function streamOnce({
  messages,
  onDelta,
}: {
  messages: Msg[];
  onDelta: (t: string) => void;
}): Promise<{ content: string; toolCalls: ToolCall[] }> {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({
      // Strip UI-only fields before sending
      messages: messages.map(({ role, content, tool_calls, tool_call_id }) => ({
        role, content, ...(tool_calls && { tool_calls }), ...(tool_call_id && { tool_call_id }),
      })),
      scenario: SCENARIO,
    }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: `Error ${resp.status}` }));
    throw new Error(err.error || `Error ${resp.status}`);
  }
  if (!resp.body) throw new Error("No response body");

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let content = "";
  const toolCallsMap = new Map<number, ToolCall>();

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
      if (json === "[DONE]") return { content, toolCalls: [...toolCallsMap.values()] };
      try {
        const delta = JSON.parse(json).choices?.[0]?.delta;
        if (!delta) continue;
        if (delta.content) {
          content += delta.content;
          onDelta(delta.content);
        }
        // Accumulate tool_calls deltas (OpenAI-style streaming)
        if (Array.isArray(delta.tool_calls)) {
          for (const tc of delta.tool_calls) {
            const i = tc.index ?? 0;
            const cur = toolCallsMap.get(i) ?? { id: "", name: "", args: "" };
            if (tc.id) cur.id = tc.id;
            if (tc.function?.name) cur.name = tc.function.name;
            if (tc.function?.arguments) cur.args += tc.function.arguments;
            toolCallsMap.set(i, cur);
          }
        }
      } catch { /* partial chunk */ }
    }
  }
  return { content, toolCalls: [...toolCallsMap.values()] };
}

export function FloatingAIBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [runningTool, setRunningTool] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, runningTool]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    setMessages((p) => [...p, userMsg]);
    setInput("");
    setLoading(true);

    let convo: Msg[] = [...messages, userMsg];

    try {
      // Tool-calling loop — up to 4 rounds (most queries finish in 1–2)
      for (let round = 0; round < 4; round++) {
        let assistantSoFar = "";
        const assistantIdx = convo.length; // where the next assistant msg will land

        // Insert empty assistant placeholder for streaming text
        setMessages([...convo, { role: "assistant", content: "" }]);

        const { content, toolCalls } = await streamOnce({
          messages: convo,
          onDelta: (chunk) => {
            assistantSoFar += chunk;
            setMessages((prev) => prev.map((m, i) =>
              i === assistantIdx ? { ...m, content: assistantSoFar } : m
            ));
          },
        });

        const assistantMsg: Msg = {
          role: "assistant",
          content,
          ...(toolCalls.length && {
            tool_calls: toolCalls.map((t) => ({
              id: t.id, type: "function" as const,
              function: { name: t.name, arguments: t.args },
            })),
            uiTools: toolCalls.map((t) => ({ name: t.name, ok: true, args: t.args })),
          }),
        };
        convo = [...convo, assistantMsg];

        if (!toolCalls.length) {
          setMessages(convo);
          break;
        }

        // Execute tools client-side and append tool messages
        const toolMessages: Msg[] = [];
        const uiTools: { name: string; ok: boolean; args: string }[] = [];
        for (const tc of toolCalls) {
          setRunningTool(tc.name);
          let args: Record<string, unknown> = {};
          try { args = JSON.parse(tc.args || "{}"); } catch { /* leave empty */ }
          const result = executeTool(tc.name, args);
          const ok = !("error" in result);
          uiTools.push({ name: tc.name, ok, args: tc.args });
          toolMessages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: JSON.stringify(result),
          });
        }
        setRunningTool(null);

        // Update the assistant message with the actual ok/fail status from execution
        assistantMsg.uiTools = uiTools;
        convo = [...convo.slice(0, -1), assistantMsg, ...toolMessages];
        setMessages(convo);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Chat failed");
      setMessages((prev) => prev.filter((m) => !(m.role === "assistant" && m.content === "")));
    } finally {
      setLoading(false);
      setRunningTool(null);
    }
  };

  return (
    <>
      {/* 3D-style floating AI orb — compact (44px) and futuristic */}
      <motion.button
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close assistant" : "Open AI assistant"}
        whileTap={{ scale: 0.88 }}
        whileHover={{ scale: 1.08 }}
        animate={{ y: [0, -3, 0] }}
        transition={{ y: { duration: 3.2, repeat: Infinity, ease: "easeInOut" } }}
        className="group fixed bottom-5 right-5 z-50 w-11 h-11 rounded-full flex items-center justify-center"
        style={{
          background:
            "radial-gradient(circle at 30% 25%, hsl(215 100% 70%) 0%, hsl(220 85% 45%) 35%, hsl(235 75% 22%) 75%, hsl(240 60% 12%) 100%)",
          boxShadow:
            "0 10px 22px -6px hsl(220 85% 30% / 0.55), 0 4px 10px -2px hsl(220 80% 20% / 0.45), inset 0 1.5px 1.5px hsl(0 0% 100% / 0.55), inset 0 -2.5px 4px hsl(235 80% 8% / 0.6), inset 0 0 0 0.5px hsl(220 60% 60% / 0.4)",
        }}
      >
        {/* Outer rotating conic ring (energy aura) */}
        <span
          aria-hidden
          className="absolute -inset-[3px] rounded-full opacity-70 group-hover:opacity-100 transition-opacity"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0%, hsl(195 100% 65% / 0.7) 25%, transparent 50%, hsl(265 90% 70% / 0.6) 75%, transparent 100%)",
            filter: "blur(3px)",
            animation: "spin 4s linear infinite",
          }}
        />
        {/* Inner glass dome */}
        <span
          aria-hidden
          className="absolute inset-[3px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 35% 25%, hsl(0 0% 100% / 0.45) 0%, hsl(0 0% 100% / 0.08) 28%, transparent 55%)",
          }}
        />
        {/* Top specular highlight */}
        <span
          aria-hidden
          className="absolute top-[3px] left-[6px] w-3.5 h-1.5 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(ellipse, hsl(0 0% 100% / 0.85) 0%, transparent 70%)",
            filter: "blur(0.5px)",
          }}
        />
        {/* Pulsing core glow behind icon */}
        <motion.span
          aria-hidden
          className="absolute inset-2 rounded-full pointer-events-none"
          animate={{ opacity: [0.35, 0.7, 0.35], scale: [0.85, 1.05, 0.85] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          style={{
            background: "radial-gradient(circle, hsl(195 100% 75% / 0.55) 0%, transparent 65%)",
          }}
        />
        {/* 3D Robot character */}
        <motion.span
          className="relative z-10"
          animate={open ? { rotate: 90, scale: 0.9 } : { rotate: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 18 }}
        >
          {open ? (
            <X className="w-4 h-4 text-white drop-shadow-[0_1px_2px_hsl(220_80%_15%/0.8)]" strokeWidth={2.6} />
          ) : (
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none" className="drop-shadow-[0_1px_2px_hsl(220_80%_15%/0.9)]">
              <defs>
                <linearGradient id="bot-body" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(0 0% 100%)" />
                  <stop offset="45%" stopColor="hsl(210 30% 92%)" />
                  <stop offset="100%" stopColor="hsl(215 25% 70%)" />
                </linearGradient>
                <linearGradient id="bot-face" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(220 60% 18%)" />
                  <stop offset="100%" stopColor="hsl(225 70% 8%)" />
                </linearGradient>
                <radialGradient id="bot-eye" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="hsl(180 100% 90%)" />
                  <stop offset="60%" stopColor="hsl(195 100% 60%)" />
                  <stop offset="100%" stopColor="hsl(210 100% 45%)" />
                </radialGradient>
              </defs>
              {/* Antenna */}
              <line x1="16" y1="2.5" x2="16" y2="6" stroke="hsl(215 25% 75%)" strokeWidth="1.2" strokeLinecap="round" />
              <circle cx="16" cy="2.2" r="1.3" fill="hsl(0 90% 60%)">
                <animate attributeName="opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite" />
              </circle>
              {/* Head shell */}
              <rect x="6" y="5.5" width="20" height="16" rx="5.5" fill="url(#bot-body)" stroke="hsl(215 30% 55%)" strokeWidth="0.5" />
              {/* Top highlight strip */}
              <rect x="8" y="6.5" width="16" height="2" rx="1" fill="hsl(0 0% 100% / 0.55)" />
              {/* Face screen */}
              <rect x="9" y="9.5" width="14" height="9" rx="3" fill="url(#bot-face)" stroke="hsl(220 50% 25%)" strokeWidth="0.4" />
              {/* Eyes */}
              <circle cx="13" cy="14" r="1.7" fill="url(#bot-eye)">
                <animate attributeName="r" values="1.7;0.4;1.7" dur="3.5s" repeatCount="indefinite" />
              </circle>
              <circle cx="19" cy="14" r="1.7" fill="url(#bot-eye)">
                <animate attributeName="r" values="1.7;0.4;1.7" dur="3.5s" repeatCount="indefinite" />
              </circle>
              {/* Eye glow */}
              <circle cx="13" cy="14" r="0.5" fill="hsl(0 0% 100%)" />
              <circle cx="19" cy="14" r="0.5" fill="hsl(0 0% 100%)" />
              {/* Mouth indicator */}
              <rect x="13.5" y="16.5" width="5" height="0.8" rx="0.4" fill="hsl(195 100% 65%)" opacity="0.7" />
              {/* Side ear pods */}
              <rect x="4.5" y="11" width="2" height="5" rx="1" fill="hsl(215 25% 70%)" />
              <rect x="25.5" y="11" width="2" height="5" rx="1" fill="hsl(215 25% 70%)" />
              <circle cx="5.5" cy="13.5" r="0.6" fill="hsl(195 100% 60%)" />
              <circle cx="26.5" cy="13.5" r="0.6" fill="hsl(195 100% 60%)" />
              {/* Neck/collar */}
              <rect x="11" y="22" width="10" height="2" rx="1" fill="hsl(215 25% 60%)" />
              <rect x="12" y="24.5" width="8" height="3.5" rx="1.5" fill="url(#bot-body)" stroke="hsl(215 30% 55%)" strokeWidth="0.4" />
              {/* Chest panel light */}
              <circle cx="16" cy="26.2" r="0.7" fill="hsl(140 90% 55%)">
                <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
              </circle>
            </svg>
          )}
        </motion.span>
        {/* Status dot */}
        {!open && (
          <span
            aria-hidden
            className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-background"
            style={{
              background: "radial-gradient(circle at 30% 30%, hsl(140 90% 70%), hsl(150 85% 40%))",
              boxShadow: "0 0 6px hsl(140 90% 50% / 0.8)",
            }}
          />
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-24 right-4 left-4 z-50 max-w-md mx-auto bg-card border border-border rounded-2xl shadow-2xl shadow-black/10 flex flex-col overflow-hidden"
            style={{ maxHeight: "70vh" }}
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-gradient-to-r from-blue-600 to-indigo-700">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white">AI Medical Assistant</p>
                <p className="text-[10px] text-blue-200 flex items-center gap-1">
                  <Wrench className="w-2.5 h-2.5" /> 5 clinical tools • Online 24/7
                </p>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-white/10 transition-colors" aria-label="Close">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[200px] max-h-[50vh]">
              {messages.length === 0 && (
                <div className="text-center py-6 space-y-3">
                  <motion.div
                    className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-950/40 dark:to-indigo-950/30 flex items-center justify-center mx-auto"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Bot className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </motion.div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Welcome, Doctor! 👋</p>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed max-w-[240px] mx-auto">
                      I can run clinical calculators and check drug safety in real time. Try asking:
                    </p>
                  </div>
                  <div className="space-y-1.5 pt-2">
                    {[
                      "Calculate EDD for LMP 2025-01-15, cycle 30 days",
                      "Bishop score: 3cm, 70%, station -1, soft, anterior",
                      "Is Warfarin and Methyldopa safe in pregnancy?",
                      "MgSO4 dose for severe preeclampsia, normal renal function",
                    ].map((q) => (
                      <button
                        key={q}
                        onClick={() => setInput(q)}
                        className="block w-full text-[11px] text-left px-3 py-2 rounded-xl bg-muted/60 hover:bg-muted transition-colors text-muted-foreground"
                      >
                        💡 {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => {
                if (m.role === "tool") return null; // Hidden from UI; status shown via chips on assistant msg
                if (m.role === "assistant" && !m.content && !m.uiTools?.length) return null;
                return (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    {m.role === "assistant" && (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mr-2 mt-1 shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className={`max-w-[80%] space-y-1.5 ${m.role === "user" ? "items-end" : "items-start"}`}>
                      {m.uiTools?.map((t, ti) => {
                        const meta = TOOL_LABELS[t.name] ?? { label: t.name, icon: "🔧" };
                        const target = t.ok ? getSaveTarget(t.name, t.args) : null;
                        return (
                          <div key={ti} className="flex items-center gap-1.5 flex-wrap">
                            <div className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40 w-fit">
                              <span>{meta.icon}</span>
                              <span className="font-semibold">{meta.label}</span>
                              {t.ok && <CheckCircle2 className="w-2.5 h-2.5" />}
                            </div>
                            {target && (
                              <Link
                                to={buildSaveToToolsUrl(target)}
                                onClick={() => stashPrefill(target)}
                                className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-colors font-semibold"
                                aria-label={`Open ${meta.label} in Tools with values prefilled`}
                                title="Open in Tools with these values"
                              >
                                <ExternalLink className="w-2.5 h-2.5" />
                                Save to Tools
                              </Link>
                            )}
                          </div>
                        );
                      })}
                      {m.content && (
                        <div className={`rounded-2xl px-3.5 py-2.5 text-sm ${
                          m.role === "user"
                            ? "bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-br-md"
                            : "bg-muted rounded-bl-md"
                        }`}>
                          {m.role === "assistant" ? (
                            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1.5 prose-ul:my-1.5">
                              <ReactMarkdown>{m.content}</ReactMarkdown>
                            </div>
                          ) : m.content}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {runningTool && (
                <div className="flex justify-start">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mr-2 shrink-0">
                    <Wrench className="w-4 h-4 text-white animate-pulse" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-bl-md px-3.5 py-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Running {TOOL_LABELS[runningTool]?.label ?? runningTool}…
                  </div>
                </div>
              )}

              {loading && !runningTool && messages[messages.length - 1]?.role === "user" && (
                <div className="flex justify-start">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mr-2 shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-bl-md px-3.5 py-2.5">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="flex gap-2 p-3 border-t border-border/50 bg-background/50">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                placeholder="Ask anything — I'll use tools when needed…"
                className="flex-1 h-10 rounded-xl text-sm"
                disabled={loading}
              />
              <Button size="icon" onClick={send} disabled={loading || !input.trim()} className="rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
