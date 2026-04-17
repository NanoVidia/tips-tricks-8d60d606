import { useState, useMemo } from "react";
import { Search, Play, ChevronRight, Star as StarIcon, Filter, X, Check, ArrowLeft, FolderOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookmarkButton } from "@/components/tools/BookmarkButton";
import { surgeries, surgeryCategories, type Surgery, type SurgeryCategory } from "@/data/surgeriesData";

const DIFF_LABELS = ["", "Basic", "Intermediate", "Advanced", "Expert", "Master"] as const;
const DIFF_COLORS = ["", "text-emerald-400", "text-blue-400", "text-amber-400", "text-orange-400", "text-red-400"] as const;

function DifficultyStars({ level }: { level: number }) {
  return (
    <span className="inline-flex gap-0.5" title={`Difficulty: ${DIFF_LABELS[level]}`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < level ? DIFF_COLORS[level] : "text-muted-foreground/30"}>★</span>
      ))}
    </span>
  );
}

function MCQBlock({ mcqs }: { mcqs: Surgery["mcqs"] }) {
  const [picked, setPicked] = useState<Record<number, number>>({});

  return (
    <div className="space-y-4">
      {mcqs.map((m, qi) => {
        const revealed = qi in picked;
        return (
          <div key={qi} className="space-y-2">
            <p className="text-sm font-medium leading-snug">
              <Badge variant="outline" className="text-[10px] mr-1.5">Q{qi + 1}</Badge>
              {m.q}
            </p>
            <div className="space-y-1">
              {m.opts.map((o, oi) => {
                const isCorrect = oi === m.correct;
                const isPicked = picked[qi] === oi;
                return (
                  <button
                    key={oi}
                    onClick={() => !revealed && setPicked((p) => ({ ...p, [qi]: oi }))}
                    disabled={revealed}
                    className={`w-full text-left text-xs px-3 py-2 rounded-lg border transition ${
                      revealed
                        ? isCorrect
                          ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                          : isPicked
                          ? "border-red-500/50 bg-red-500/10 text-red-300"
                          : "border-border/30 text-muted-foreground"
                        : "border-border/40 hover:bg-muted/40"
                    }`}
                  >
                    <span className="font-medium mr-1">{String.fromCharCode(65 + oi)}.</span>
                    {o}
                    {revealed && isCorrect && <Check className="inline ml-1 w-3 h-3" />}
                    {revealed && isPicked && !isCorrect && <X className="inline ml-1 w-3 h-3" />}
                  </button>
                );
              })}
            </div>
            {revealed && (
              <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-2 leading-relaxed">
                {m.explain}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function SurgeryLibrary() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<SurgeryCategory | "All" | null>(null); // null = index view
  const [difficulty, setDifficulty] = useState<number>(0); // 0 = all
  const [selected, setSelected] = useState<Surgery | null>(null);

  const isIndexView = category === null && !search.trim();

  const filtered = useMemo(() => {
    let list = surgeries;
    if (category && category !== "All") list = list.filter((s) => s.category === category);
    if (difficulty > 0) list = list.filter((s) => s.difficulty === difficulty);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.summary.toLowerCase().includes(q) ||
          s.approach.some((a) => a.toLowerCase().includes(q)) ||
          s.indications.some((i) => i.toLowerCase().includes(q))
      );
    }
    return list;
  }, [search, category, difficulty]);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="text-center space-y-1">
        <h2 className="text-lg font-bold">Surgery Encyclopedia</h2>
        <p className="text-xs text-muted-foreground">{surgeries.length} procedures • Video • Steps • MCQs</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search surgeries…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* INDEX VIEW: category cards */}
      {isIndexView ? (
        <>
          <div className="flex items-center justify-between pt-1">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Browse by category</h3>
            <button
              onClick={() => setCategory("All")}
              className="text-[11px] text-primary hover:underline"
            >
              View all →
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {surgeryCategories
              .filter((c) => c.id !== "All")
              .map((c) => {
                const count = surgeries.filter((s) => s.category === c.id).length;
                return (
                  <Card
                    key={c.id}
                    onClick={() => setCategory(c.id as SurgeryCategory)}
                    className="p-3 cursor-pointer border-border/50 hover:border-primary/50 hover:bg-muted/30 transition group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <FolderOpen className="w-4 h-4 text-primary mb-1.5" />
                        <h4 className="text-sm font-semibold leading-tight">{c.label}</h4>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{count} procedure{count !== 1 ? "s" : ""}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition shrink-0" />
                    </div>
                  </Card>
                );
              })}
          </div>
          <p className="text-[10px] text-center text-muted-foreground pt-2">
            Tip: use search above to find a procedure across all categories.
          </p>
        </>
      ) : (
        <>
          {/* Back / context bar */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => { setCategory(null); setDifficulty(0); }}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition"
            >
              <ArrowLeft className="w-3 h-3" />
              All categories
            </button>
            <span className="text-[11px] text-muted-foreground">
              {category && category !== "All" ? (
                <>
                  <Badge variant="secondary" className="text-[10px] mr-1">{category}</Badge>
                  {filtered.length} result{filtered.length !== 1 ? "s" : ""}
                </>
              ) : (
                <>{filtered.length} of {surgeries.length}</>
              )}
            </span>
          </div>

          {/* Difficulty filter (only inside category/search view) */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-muted-foreground font-medium">Difficulty:</span>
            <button
              onClick={() => setDifficulty(0)}
              className={`text-[11px] px-2 py-0.5 rounded-full border transition ${
                difficulty === 0
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border/50 text-muted-foreground hover:bg-muted/60"
              }`}
            >
              All
            </button>
            {[1, 2, 3, 4, 5].map((d) => {
              const active = difficulty === d;
              const count = surgeries.filter((s) => s.difficulty === d && (!category || category === "All" || s.category === category)).length;
              return (
                <button
                  key={d}
                  onClick={() => setDifficulty(active ? 0 : d)}
                  title={`${DIFF_LABELS[d]} (${count})`}
                  className={`text-[11px] px-2 py-0.5 rounded-full border transition flex items-center gap-0.5 ${
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border/50 text-muted-foreground hover:bg-muted/60"
                  }`}
                >
                  <span className={active ? "" : DIFF_COLORS[d]}>{"★".repeat(d)}</span>
                  <span className="opacity-60 ml-0.5">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Procedure list */}
          {filtered.length === 0 ? (
            <Card className="p-8 text-center border-border/50">
              <Filter className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">No surgeries match your search.</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {filtered.map((s) => (
                <Card
                  key={s.id}
                  className="p-3 border-border/50 cursor-pointer hover:bg-muted/30 transition group"
                  onClick={() => setSelected(s)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                        <Badge variant="outline" className="text-[9px] shrink-0">{s.category}</Badge>
                        <DifficultyStars level={s.difficulty} />
                      </div>
                      <h3 className="text-sm font-semibold leading-snug">{s.name}</h3>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{s.summary}</p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {s.approach.map((a) => (
                          <span key={a} className="text-[9px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground">{a}</span>
                        ))}
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground">⏱ {s.duration}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-1.5 shrink-0">
                      <BookmarkButton id={`surgery-${s.id}`} label={s.name} size="sm" />
                      <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-foreground transition" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        {selected && (
          <DialogContent className="max-w-lg max-h-[90vh] p-0 overflow-hidden">
            <ScrollArea className="max-h-[90vh]">
              <div className="p-5 space-y-4">
                <DialogHeader>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-[10px]">{selected.category}</Badge>
                    <DifficultyStars level={selected.difficulty} />
                    <span className="text-[10px] text-muted-foreground">⏱ {selected.duration}</span>
                  </div>
                  <DialogTitle className="text-lg">{selected.name}</DialogTitle>
                  <DialogDescription className="text-xs leading-relaxed">{selected.summary}</DialogDescription>
                </DialogHeader>

                {/* Approach pills */}
                <div className="flex flex-wrap gap-1">
                  {selected.approach.map((a) => (
                    <Badge key={a} variant="secondary" className="text-[10px]">{a}</Badge>
                  ))}
                </div>

                {/* YouTube — nocookie embed + fallback links so a blocked/dead video never strands the user */}
                <div className="space-y-1.5">
                  <h4 className="text-sm font-bold flex items-center gap-1.5"><Play className="w-3.5 h-3.5 text-red-400" /> Video</h4>
                  <div className="aspect-video rounded-lg overflow-hidden bg-black">
                    <iframe
                      key={selected.videoId}
                      src={`https://www.youtube-nocookie.com/embed/${selected.videoId}?rel=0&modestbranding=1`}
                      title={selected.videoTitle}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                      allowFullScreen
                      referrerPolicy="strict-origin-when-cross-origin"
                      className="w-full h-full"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">{selected.videoTitle} — {selected.videoChannel}</p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <a
                      href={`https://www.youtube.com/watch?v=${selected.videoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] px-2 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition"
                    >
                      ▶ Open on YouTube
                    </a>
                    <a
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(selected.name + " surgical technique")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] px-2 py-1 rounded-md bg-muted text-foreground hover:bg-accent/20 transition"
                    >
                      🔎 Search more videos
                    </a>
                  </div>
                </div>

                {/* Accordion sections */}
                <Accordion type="multiple" className="w-full">
                  {([
                    ["Indications", selected.indications],
                    ["Contraindications", selected.contraindications],
                    ["Pre-Op Checklist", selected.preOp],
                    ["Steps", selected.steps],
                    ["Complications", selected.complications],
                    ["Post-Op Care", selected.postOp],
                  ] as [string, string[]][]).map(([title, items]) => (
                    <AccordionItem key={title} value={title}>
                      <AccordionTrigger className="text-sm py-2">{title}</AccordionTrigger>
                      <AccordionContent>
                        <ol className={`text-xs space-y-1 ${title === "Steps" ? "list-decimal" : "list-disc"} pl-4`}>
                          {items.map((item, i) => (
                            <li key={i} className="leading-relaxed">{item}</li>
                          ))}
                        </ol>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>

                {/* Pearls */}
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 space-y-1">
                  <h4 className="text-sm font-bold text-amber-400">💎 Key Pearls</h4>
                  <ul className="text-xs space-y-1 list-disc pl-4">
                    {selected.pearls.map((p, i) => (
                      <li key={i} className="leading-relaxed">{p}</li>
                    ))}
                  </ul>
                </div>

                {/* References */}
                <div className="space-y-1">
                  <h4 className="text-sm font-bold">📚 References</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.references.map((r, i) => (
                      <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" className="text-[10px] px-2 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition">
                        {r.label} ↗
                      </a>
                    ))}
                  </div>
                </div>

                {/* MCQs */}
                {selected.mcqs.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold">🧠 Test Yourself</h4>
                    <MCQBlock mcqs={selected.mcqs} />
                  </div>
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
