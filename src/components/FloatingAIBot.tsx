import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2, X, Bot, Wrench, CheckCircle2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { executeTool, TOOL_LABELS, getSaveTarget, buildSaveToToolsUrl, stashPrefill } from "@/lib/aiTools";
import { InlineDisclaimer } from "@/components/Disclaimer";

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
      {/* Full 3D robot character — head + torso + arms + legs */}
      <motion.button
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close assistant" : "Open AI assistant"}
        whileTap={{ scale: 0.92 }}
        whileHover={{ scale: 1.06 }}
        animate={{ y: [0, -4, 0] }}
        transition={{ y: { duration: 2.6, repeat: Infinity, ease: "easeInOut" } }}
        className="group fixed bottom-5 right-5 z-50 w-14 h-[72px] flex items-end justify-center bg-transparent border-0 p-0"
      >
        {/* Ground shadow */}
        <motion.span
          aria-hidden
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-10 h-2 rounded-[50%] pointer-events-none"
          animate={{ scaleX: [1, 0.85, 1], opacity: [0.45, 0.3, 0.45] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          style={{ background: "radial-gradient(ellipse, hsl(220 60% 15% / 0.55) 0%, transparent 70%)", filter: "blur(2px)" }}
        />

        {/* Robot SVG */}
        <svg
          width="56"
          height="72"
          viewBox="0 0 56 72"
          fill="none"
          className="relative z-10 drop-shadow-[0_4px_8px_hsl(220_70%_20%/0.45)]"
        >
          <defs>
            <linearGradient id="robot-shell" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(0 0% 100%)" />
              <stop offset="40%" stopColor="hsl(210 30% 90%)" />
              <stop offset="100%" stopColor="hsl(215 25% 55%)" />
            </linearGradient>
            <linearGradient id="robot-shell-side" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="hsl(215 30% 55%)" />
              <stop offset="50%" stopColor="hsl(210 30% 88%)" />
              <stop offset="100%" stopColor="hsl(215 30% 50%)" />
            </linearGradient>
            <linearGradient id="robot-face" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(225 65% 14%)" />
              <stop offset="100%" stopColor="hsl(230 75% 6%)" />
            </linearGradient>
            <linearGradient id="robot-accent" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(215 80% 55%)" />
              <stop offset="100%" stopColor="hsl(225 75% 35%)" />
            </linearGradient>
            <radialGradient id="robot-eye" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="hsl(180 100% 92%)" />
              <stop offset="55%" stopColor="hsl(195 100% 60%)" />
              <stop offset="100%" stopColor="hsl(210 100% 40%)" />
            </radialGradient>
          </defs>

          {/* Antenna */}
          <line x1="28" y1="2" x2="28" y2="7" stroke="hsl(215 25% 65%)" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="28" cy="2" r="1.6" fill="hsl(0 90% 60%)">
            <animate attributeName="opacity" values="1;0.3;1" dur="1.4s" repeatCount="indefinite" />
          </circle>

          {/* HEAD */}
          <rect x="14" y="7" width="28" height="20" rx="6" fill="url(#robot-shell)" stroke="hsl(215 35% 45%)" strokeWidth="0.6" />
          {/* Head highlight strip */}
          <rect x="16" y="8.5" width="24" height="2.2" rx="1.1" fill="hsl(0 0% 100% / 0.6)" />
          {/* Face screen */}
          <rect x="17" y="12" width="22" height="11" rx="3.5" fill="url(#robot-face)" stroke="hsl(220 50% 20%)" strokeWidth="0.5" />
          {/* Eyes */}
          <motion.g>
            <circle cx="23" cy="17" r="2.2" fill="url(#robot-eye)">
              <animate attributeName="r" values="2.2;0.5;2.2" dur="4s" repeatCount="indefinite" />
            </circle>
            <circle cx="33" cy="17" r="2.2" fill="url(#robot-eye)">
              <animate attributeName="r" values="2.2;0.5;2.2" dur="4s" repeatCount="indefinite" />
            </circle>
            <circle cx="23.5" cy="16.3" r="0.6" fill="hsl(0 0% 100%)" />
            <circle cx="33.5" cy="16.3" r="0.6" fill="hsl(0 0% 100%)" />
          </motion.g>
          {/* Mouth bar */}
          <rect x="24" y="20" width="8" height="1" rx="0.5" fill="hsl(195 100% 65%)" opacity="0.8">
            <animate attributeName="width" values="8;3;8" dur="3s" repeatCount="indefinite" />
          </rect>
          {/* Side ear pods */}
          <rect x="11.5" y="14" width="2.5" height="6" rx="1.2" fill="hsl(215 25% 55%)" />
          <rect x="42" y="14" width="2.5" height="6" rx="1.2" fill="hsl(215 25% 55%)" />
          <circle cx="12.7" cy="17" r="0.7" fill="hsl(195 100% 60%)" />
          <circle cx="43.2" cy="17" r="0.7" fill="hsl(195 100% 60%)" />

          {/* Neck */}
          <rect x="24" y="27" width="8" height="3" rx="1" fill="hsl(215 25% 50%)" />
          <rect x="22" y="29.5" width="12" height="1.5" rx="0.8" fill="hsl(215 30% 40%)" />

          {/* TORSO */}
          <rect x="13" y="31" width="30" height="22" rx="5" fill="url(#robot-shell)" stroke="hsl(215 35% 45%)" strokeWidth="0.6" />
          {/* Torso side shading */}
          <rect x="13" y="31" width="3" height="22" rx="2" fill="hsl(215 35% 50% / 0.5)" />
          <rect x="40" y="31" width="3" height="22" rx="2" fill="hsl(215 35% 50% / 0.5)" />
          {/* Chest panel */}
          <rect x="20" y="35" width="16" height="13" rx="2.5" fill="url(#robot-accent)" stroke="hsl(220 60% 28%)" strokeWidth="0.5" />
          {/* Core reactor */}
          <circle cx="28" cy="41.5" r="3.5" fill="hsl(225 70% 12%)" stroke="hsl(195 100% 55%)" strokeWidth="0.6" />
          <motion.circle cx="28" cy="41.5" r="2.2" fill="hsl(195 100% 65%)">
            <animate attributeName="r" values="2.2;1.4;2.2" dur="1.8s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="1;0.5;1" dur="1.8s" repeatCount="indefinite" />
          </motion.circle>
          <circle cx="28" cy="41.5" r="0.8" fill="hsl(0 0% 100%)" />
          {/* Status LEDs */}
          <circle cx="22.5" cy="46" r="0.7" fill="hsl(140 90% 55%)">
            <animate attributeName="opacity" values="1;0.3;1" dur="1.6s" repeatCount="indefinite" />
          </circle>
          <circle cx="25" cy="46" r="0.7" fill="hsl(45 95% 60%)">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="2.1s" repeatCount="indefinite" />
          </circle>
          <circle cx="33.5" cy="46" r="0.7" fill="hsl(0 90% 60%)" opacity="0.7" />

          {/* ARMS — animated subtle sway */}
          <motion.g
            style={{ transformOrigin: "13px 33px" }}
            animate={{ rotate: [-3, 3, -3] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <rect x="7" y="32" width="5" height="14" rx="2.5" fill="url(#robot-shell-side)" stroke="hsl(215 35% 45%)" strokeWidth="0.4" />
            <circle cx="9.5" cy="48" r="3" fill="url(#robot-shell)" stroke="hsl(215 35% 45%)" strokeWidth="0.5" />
            <circle cx="9.5" cy="48" r="1" fill="hsl(195 100% 55%)" opacity="0.7" />
          </motion.g>
          <motion.g
            style={{ transformOrigin: "43px 33px" }}
            animate={{ rotate: [3, -3, 3] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <rect x="44" y="32" width="5" height="14" rx="2.5" fill="url(#robot-shell-side)" stroke="hsl(215 35% 45%)" strokeWidth="0.4" />
            <circle cx="46.5" cy="48" r="3" fill="url(#robot-shell)" stroke="hsl(215 35% 45%)" strokeWidth="0.5" />
            <circle cx="46.5" cy="48" r="1" fill="hsl(195 100% 55%)" opacity="0.7" />
          </motion.g>

          {/* LEGS */}
          <rect x="18" y="53" width="7" height="13" rx="2.5" fill="url(#robot-shell-side)" stroke="hsl(215 35% 45%)" strokeWidth="0.5" />
          <rect x="31" y="53" width="7" height="13" rx="2.5" fill="url(#robot-shell-side)" stroke="hsl(215 35% 45%)" strokeWidth="0.5" />
          {/* Knee joints */}
          <circle cx="21.5" cy="60" r="1.2" fill="hsl(220 60% 35%)" />
          <circle cx="34.5" cy="60" r="1.2" fill="hsl(220 60% 35%)" />
          {/* Feet */}
          <ellipse cx="21.5" cy="67" rx="5" ry="2.2" fill="url(#robot-shell)" stroke="hsl(215 35% 45%)" strokeWidth="0.5" />
          <ellipse cx="34.5" cy="67" rx="5" ry="2.2" fill="url(#robot-shell)" stroke="hsl(215 35% 45%)" strokeWidth="0.5" />

          {/* X overlay when open */}
          {open && (
            <>
              <rect x="0" y="0" width="56" height="72" fill="hsl(220 70% 10% / 0.55)" rx="8" />
              <line x1="20" y1="28" x2="36" y2="44" stroke="hsl(0 0% 100%)" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="36" y1="28" x2="20" y2="44" stroke="hsl(0 0% 100%)" strokeWidth="3.5" strokeLinecap="round" />
            </>
          )}
        </svg>
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
                      {m.role === "assistant" && m.content && <InlineDisclaimer />}
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
