import { useMemo, useState } from "react";
import { Search, X, BookOpen, Stethoscope, Shield, Sparkles, Settings2, Bookmark, AlertTriangle, HelpCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type Category = {
  id: string;
  label: string;
  icon: typeof BookOpen;
  color: string;
  items: { q: string; a: string | string[] }[];
};

const CATEGORIES: Category[] = [
  {
    id: "general",
    label: "About the app",
    icon: BookOpen,
    color: "from-sky-500 to-indigo-600",
    items: [
      {
        q: "What is Tips & Tricks?",
        a: "A curated bedside OB/GYN reference with 200+ clinical scenarios, ready-to-use scripts, calculators, emergency protocols, drug-in-pregnancy data, MCQs and an AI assistant — designed to support clinicians during real-world decision-making.",
      },
      {
        q: "Who is this app for?",
        a: "Practicing obstetricians and gynecologists, residents in training, midwives, labor-and-delivery nurses, and senior medical students rotating through OB/GYN.",
      },
      {
        q: "Is the content peer-reviewed?",
        a: "Each entry is mapped to recognized guideline bodies (ACOG, RCOG, NICE, WHO, FIGO, ESC where relevant) and is reviewed by OB/GYN physicians before release. Sources are listed under Menu → Scientific sources.",
      },
      {
        q: "How often is the content updated?",
        a: "We push content updates as societies publish new guidance — typically every 4–8 weeks. Open Menu → Changelog to see what changed in the latest version.",
      },
    ],
  },
  {
    id: "clinical",
    label: "Clinical use",
    icon: Stethoscope,
    color: "from-emerald-500 to-teal-600",
    items: [
      {
        q: "Can I use it as a guideline replacement?",
        a: "No. This is an educational quick-reference. Always verify dosing, eligibility and exact thresholds against your local protocol and the most recent official guideline before acting on any recommendation.",
      },
      {
        q: "How are emergency protocols structured?",
        a: [
          "Each protocol is a numbered, time-ordered checklist that mirrors how the event unfolds at the bedside.",
          "Targets (e.g. SBP <160 in severe pre-eclampsia, MgSO4 loading 4–6 g IV) are highlighted in a green box at the bottom for instant reference.",
          "Tap the bookmark icon to pin a protocol to your Favorites for one-tap access during a real event.",
        ],
      },
      {
        q: "How are calculator results validated?",
        a: "Calculators (EDD, Bishop, Apgar, MgSO4, BMI, Ovulation, Gonadotropin) implement the published formulas exactly. They show inputs and outputs only — interpretation and dosing decisions remain a clinical judgment.",
      },
      {
        q: "What does the FDA pregnancy category mean?",
        a: "FDA categories A, B, C, D and X grade fetal-risk evidence from controlled human studies (A) to known teratogens contraindicated in pregnancy (X). The new PLLR system replaces these letters with narrative summaries — both should be checked when prescribing.",
      },
      {
        q: "Are differential-diagnosis lists exhaustive?",
        a: "DDx lists prioritize the highest-yield 'don't-miss' diagnoses for each presentation. Always pair them with history, exam and risk-stratified workup — they are a thinking aid, not a complete textbook.",
      },
    ],
  },
  {
    id: "ai",
    label: "AI assistant",
    icon: Sparkles,
    color: "from-violet-500 to-fuchsia-600",
    items: [
      {
        q: "How does the AI assistant work?",
        a: "It is grounded on the same curated content that powers the rest of the app and uses retrieval before answering. It returns short, structured replies with the relevant scenario or protocol whenever possible.",
      },
      {
        q: "Can I trust AI answers for patient care?",
        a: "Treat AI output as a second opinion, not a final answer. Verify every recommendation against the source it cites and your local protocol before acting on it.",
      },
      {
        q: "Does the AI see my patient's data?",
        a: "Only the text you type into the chat is sent for processing. Never include patient names, medical-record numbers, phone numbers or any identifiable data.",
      },
    ],
  },
  {
    id: "privacy",
    label: "Privacy & data",
    icon: Shield,
    color: "from-amber-500 to-orange-600",
    items: [
      {
        q: "What data does the app collect?",
        a: "Anonymous usage analytics (which sections are opened, error reports) to improve the app. Personal accounts, when used, store only the email and preferences you provide. See Menu → Privacy Policy for the full list.",
      },
      {
        q: "Is patient data stored anywhere?",
        a: "No. The app is not designed to store identifiable patient data. Bookmarks, settings and reorder preferences are kept locally on your device only.",
      },
      {
        q: "Does the app share data with third parties?",
        a: "Aggregated analytics and crash reports are sent to anonymized telemetry providers. No identifiable clinical content is shared. Full disclosure is in the Privacy Policy.",
      },
    ],
  },
  {
    id: "features",
    label: "Features & shortcuts",
    icon: Bookmark,
    color: "from-pink-500 to-rose-600",
    items: [
      {
        q: "How do I save items to Favorites?",
        a: "Tap the bookmark icon on any tool card, protocol, drug or DDx item. Open Tools → Favorites to see everything you've pinned.",
      },
      {
        q: "Can I reorder protocols?",
        a: "Yes. In Emergency Protocols and DDx tabs, drag the handle (≡) on the left of any item to reorder. The new order is saved on this device.",
      },
      {
        q: "How does smart search work?",
        a: "Search is fuzzy and runs across titles, situations, action steps and clinical synonyms. Matches are highlighted, and critical-priority results are surfaced first.",
      },
      {
        q: "Does it work offline?",
        a: "Most reference content (scenarios, protocols, calculators, drugs) is cached after first load and works offline. AI chat, video links and live database updates require internet.",
      },
      {
        q: "Can I install it like a native app?",
        a: "Yes — open the share menu in your mobile browser and choose 'Add to Home Screen'. The app then runs full-screen, just like a native install.",
      },
    ],
  },
  {
    id: "settings",
    label: "Settings & accessibility",
    icon: Settings2,
    color: "from-slate-500 to-zinc-600",
    items: [
      {
        q: "How do I switch between light and dark mode?",
        a: "Use the sun/moon icon in the top header, or open Menu → Theme.",
      },
      {
        q: "Is there a low-end / performance mode?",
        a: "Yes. The app auto-detects low-RAM and low-core devices and trims animations. You can also force it via Menu → Accessibility → Reduce motion.",
      },
      {
        q: "Can I increase text size?",
        a: "The app respects your device's system text-size setting. For larger text everywhere, increase the system font scale in your device settings.",
      },
    ],
  },
  {
    id: "trouble",
    label: "Troubleshooting",
    icon: AlertTriangle,
    color: "from-red-500 to-rose-700",
    items: [
      {
        q: "Content looks outdated. What do I do?",
        a: "Pull-to-refresh the page, or close and reopen the app. If you installed it to your home screen, the service worker fetches a fresh copy in the background and applies it on next launch.",
      },
      {
        q: "AI chat is slow or won't respond.",
        a: "Check your internet connection first. If the issue persists, try again in a few minutes — the AI provider may be under load. Persistent issues can be reported via Menu → Report a bug.",
      },
      {
        q: "I lost my bookmarks after clearing browser data.",
        a: "Bookmarks are stored locally; clearing site data removes them. To preserve them across devices, sign in once an account is created (coming soon).",
      },
    ],
  },
];

export function FaqSection() {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!q) return CATEGORIES;
    return CATEGORIES.map((cat) => ({
      ...cat,
      items: cat.items.filter((it) => {
        const ans = Array.isArray(it.a) ? it.a.join(" ") : it.a;
        return it.q.toLowerCase().includes(q) || ans.toLowerCase().includes(q);
      }),
    })).filter((cat) => cat.items.length > 0);
  }, [q]);

  const totalQuestions = CATEGORIES.reduce((n, c) => n + c.items.length, 0);
  const matchedQuestions = filtered.reduce((n, c) => n + c.items.length, 0);

  return (
    <div className="space-y-5">
      {/* Hero / intro */}
      <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 to-primary/0 p-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <HelpCircle className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-[15px] font-bold leading-tight">Frequently Asked Questions</h3>
            <p className="text-xs text-muted-foreground leading-snug">
              {totalQuestions} curated answers across {CATEGORIES.length} topics
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search questions… (e.g. 'magnesium', 'bookmarks', 'offline')"
          className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-10 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
          aria-label="Search FAQ"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {q && (
        <p className="-mt-2 text-xs text-muted-foreground">
          {matchedQuestions} match{matchedQuestions === 1 ? "" : "es"} for "{query}"
        </p>
      )}

      {/* Categorized accordion */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-center">
          <p className="text-sm font-semibold">No results</p>
          <p className="mt-1 text-xs text-muted-foreground">Try a different keyword or clear the search.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {filtered.map((cat) => {
            const Icon = cat.icon;
            return (
              <section key={cat.id}>
                <header className="mb-2 flex items-center gap-2.5 px-1">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${cat.color} text-white shadow-sm`}>
                    <Icon className="h-4 w-4" strokeWidth={2.4} />
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold leading-tight">{cat.label}</h4>
                    <p className="text-[11px] text-muted-foreground">{cat.items.length} question{cat.items.length === 1 ? "" : "s"}</p>
                  </div>
                </header>
                <Accordion type="single" collapsible className="space-y-2">
                  {cat.items.map((it, idx) => (
                    <AccordionItem
                      key={idx}
                      value={`${cat.id}-${idx}`}
                      className="overflow-hidden rounded-xl border border-border/60 bg-card"
                    >
                      <AccordionTrigger className="px-3.5 py-3 text-left text-[13px] font-semibold leading-snug hover:no-underline">
                        {it.q}
                      </AccordionTrigger>
                      <AccordionContent className="px-3.5 pb-3.5 pt-0">
                        {Array.isArray(it.a) ? (
                          <ul className="space-y-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
                            {it.a.map((line, i) => (
                              <li key={i} className="flex gap-2">
                                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-primary" />
                                <span>{line}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-[12.5px] leading-relaxed text-muted-foreground">{it.a}</p>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>
            );
          })}
        </div>
      )}

      <p className="rounded-xl border border-border/60 bg-muted/30 px-3.5 py-3 text-[11px] leading-relaxed text-muted-foreground">
        ⚠️ Educational reference only. Always verify clinical decisions against your local protocol and current official guidance.
      </p>
    </div>
  );
}
